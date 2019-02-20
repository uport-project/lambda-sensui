
const jsonRpcProtocol = require('json-rpc-protocol')
const networks = require('../lib/networks');
const rp = require('request-promise-native');
const Transaction = require ('ethereumjs-tx');

module.exports = class RpcHandler {
    constructor (authMgr) {
        this.authMgr=authMgr;
    }

    async handle(event,context, cb) {
        //Just for timestamping the start of the call
        console.log("Start..");

        //Check supported network id
        let networkId;
        if (event.pathParameters && event.pathParameters.networkId){
            networkId = event.pathParameters.networkId;
        }else{
            const err="no networkId"
            cb({code: 400, message: err})
            return;
        }
        console.log("networkId: "+networkId)

        //Verify if networkId is defined
        if(networks[networkId] === undefined || networks[networkId].rpcUrl === undefined){
            const err="undefined networkId";
            cb({code: 400, message: err})
            return;
        }

        //Check authToken
        let authToken;
        if (event.pathParameters && event.pathParameters.authToken){
            authToken = event.pathParameters.authToken;
        }else{
            const err="no authToken"
            cb({code: 401, message: err})
            return;
        }
        console.log("authToken: "+authToken)

        
        //Parse json-rpc format
        let jsonRpcMsg
        try {
            jsonRpcMsg  = await jsonRpcProtocol.parse(event.body)
        } catch (error) {
            const err=JSON.parse(jsonRpcProtocol.format.error(0,error));
            console.log(err)
            cb(err);
            return;
        }
        console.log(jsonRpcMsg);

        //Handle relayed RPC action
        if(jsonRpcMsg.method !== "eth_sendRawTransaction"){

            //Relay to networkEndpoint
            const options = {
                method: 'POST',
                uri: networks[networkId].rpcUrl,
                body: jsonRpcMsg,
                json: true 
            };
            
            let relayedResp;
            try{
                relayedResp = await rp(options);
            }catch(error){
                console.log("request error: "+error.message)
                const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32000)
                const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
                console.log(err)
                cb(err);
                return;
            }
            cb(null,relayedResp)
            return;
        }

        //Handle funding RPC action (aka: eth_sendRawTransaction)
        
        //Verify authToken (Only if method is eth_sendRawTransaction)
        let verifiedAuthToken;
        try {
            //This can take up to 3 secs.
            verifiedAuthToken = await this.authMgr.verify(authToken);
        } catch (error){
            console.log("this.authMgr.verify() error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32001)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err)
            cb(err);
            return;
        } 
        console.log(verifiedAuthToken);

        const issuerDID = verifiedAuthToken.issuer;

        //Decode tx
        const txHex=jsonRpcMsg.params[0];
        let txObj;
        try{
            txObj = new Transaction(txHex);
        } catch (error){
            console.log("new Transaction(txHex) error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32002)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err)
            cb(err);
            return;
        } 
        console.log(txObj);

        //Verify Tx Signature
        try{
            if(!txObj.verifySignature()) throw Error("txObj.verifySigntature() fail")
        } catch (error){
            console.log("new Transaction(txHex) error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32003)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err)
            cb(err);
            return;
        } 

        const from = '0x' + txObj.getSenderAddress().toString('hex')
        const to = '0x'+txObj.to.toString('hex')
        const txGasPrice = parseInt(txObj.gasPrice.toString('hex'),16)
        const txGasLimit = parseInt(txObj.gasLimit.toString('hex'),16)

        console.log('    from: ' + from)
        console.log('      to: ' + to)
        console.log('    data: ' + txObj.data.toString('hex'))
        console.log('   value: ' + parseInt(txObj.value.toString('hex'), 16))
        console.log('gasPrice: ' + txGasPrice)
        console.log('gasLimit: ' + txGasLimit)


        //Check if `from` in the tx is the `sub` in the authToken;
        try{
            if(from != verifiedAuthToken.payload.sub) throw Error("token mismatch. sub does not match `from` field in tx")
        } catch (error){
            console.log("from != verifiedAuthToken.payload.sub error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32004)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err)
            cb(err);
            return;
        } 

        //Check balance of `from`


        

        const txHash = "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
        const resp= jsonRpcProtocol.format.response(jsonRpcMsg.id, txHash )

        cb(null,JSON.parse(resp))
    
    }
  
  }
  
  