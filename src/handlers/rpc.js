
const jsonRpcProtocol = require('json-rpc-protocol')
const networks = require('../lib/networks');
const rp = require('request-promise-native');

module.exports = class RpcHandler {
    constructor (authMgr,fundingMgr) {
        this.authMgr=authMgr;
        this.fundingMgr=fundingMgr;
    }

    async handle(event,context, cb) {
        //Just for timestamping the start of the call
        console.log("Start..");

        //Check supported network id
        let networkId;
        if (event.pathParameters && event.pathParameters.networkId){
            networkId = event.pathParameters.networkId;
        }else{
            cb({code: 400, message: "no networkId"}); return;
        }
        console.log("networkId: "+networkId)

        //Verify if networkId is defined
        if(networks[networkId] === undefined || networks[networkId].rpcUrl === undefined){
            cb({code: 400, message: "undefined networkId"}); return;
        }

        //Check authToken
        let authToken;
        if (event.pathParameters && event.pathParameters.authToken){
            authToken = event.pathParameters.authToken;
        }else{
            cb({code: 401, message: "no authToken"}); return;
        }
        console.log("authToken: "+authToken)

        
        //Parse json-rpc format
        let jsonRpcMsg
        try {
            jsonRpcMsg  = await jsonRpcProtocol.parse(event.body)
        } catch (error) {
            const err=JSON.parse(jsonRpcProtocol.format.error(0,error));
            console.log(err);cb(err); return;
        }
        console.log(jsonRpcMsg);

        //Handle relayed RPC action
        if(jsonRpcMsg.method !== "eth_sendRawTransaction"){
            //Relay to networkEndpoint
            await this._relay(networkId,jsonRpcMsg,cb);
            return;
        }

        //Handle funding RPC action (aka: eth_sendRawTransaction)
        
        //Verify authToken 
        // (No need to check it before if method is noteth_sendRawTransaction)
        let verifiedAuthToken;
        try {
            //This can take up to 3 secs.
            verifiedAuthToken = await this.authMgr.verify(authToken);
        } catch (error){
            console.log("this.authMgr.verify() error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32001)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err); cb(err); return;
        } 
        console.log(verifiedAuthToken);

        //console.log(verifiedAuthToken.issuer);

        //Decode and verify tx
        let txDecoded;
        try{
            txDecoded=await this.fundingMgr.decodeTx(jsonRpcMsg.params[0])
        } catch (error){
            console.log("this.fundingMgr.decodeTx() error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32002)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err); cb(err); return;
        }
        console.log(txDecoded);

        //Check if `from` in the tx is the `sub` in the authToken;
        /*
        try{
            if(txDecoded.from != verifiedAuthToken.payload.sub) throw Error("token mismatch. sub does not match `from` field in tx")
        } catch (error){
            console.log("from != verifiedAuthToken.payload.sub error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32003)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err)
            cb(err);
            return;
        }
        */ 

        //Get fundingInfo
        let fundingInfo;
        try{
            fundingInfo=await this.fundingMgr.fundingInfo(networkId,txDecoded)
        } catch (error){
            console.log("this.fundingMgr.fundingInfo() error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32004)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err); cb(err); return;
        }

        console.log(fundingInfo)

        //Check if funding is not needed
        if(!fundingInfo.isFundingNeeded){
            //Relay to networkEndpoint
            console.log("No funding needed. Relaying.")
            await this._relay(networkId,jsonRpcMsg,cb);
            return;
        }

        //Check if isAbusingGasPrice (gasPrice on tx is tooo high)
        try{
            if(fundingInfo.isAbusingGasPrice) throw Error("abusing gasPrice")
        } catch (error){
            console.log("isAbusingGasPrice: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32005)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err); cb(err); return;
        } 

        //Fund tx
        try{
            await this.fundingMgr.fundTx(
                networkId,
                txDecoded,
                fundingInfo,
                verifiedAuthToken.payload.iss.replace("did:ethr:","")
            )
        } catch (error){
            console.log("this.fundingMgr.fundTx() error: "+error.message)
            const jsonRpcError = new jsonRpcProtocol.JsonRpcError(error.message, -32006)
            const err=JSON.parse(jsonRpcProtocol.format.error(jsonRpcMsg.id,jsonRpcError));
            console.log(err); cb(err); return;
        }


        const resp= jsonRpcProtocol.format.response(jsonRpcMsg.id, txDecoded.txHash )

        cb(null,JSON.parse(resp))
    
    }
  
    async _relay(networkId,jsonRpcMsg,cb){
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

  }
  
  