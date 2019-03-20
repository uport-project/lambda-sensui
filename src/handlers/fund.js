const networks = require('../lib/networks');

module.exports = class FundHandler {
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


        let verifiedAuthToken;
        try {
            //This can take up to 3 secs.
            verifiedAuthToken = await this.authMgr.verify(authToken);
        } catch (error){
            console.log("this.authMgr.verify() error: "+error.message)
            cb({code: 401, message: "undefined networkId"}); return;
        } 
        console.log(verifiedAuthToken);


        //Parse body
        let body;
        try{
            body = JSON.parse(event.body)
        } catch(e){
            cb({code:403, message:'no json body: '+e.toString()}); return;
        }

        //Check if receiver is present
        const receiver = body.receiver
        if(!receiver){ cb({code: 403, message: "no receiver"}); return; }

        //Check if amount is present
        const amount = body.amount
        if(!amount){ cb({code: 403, message: "no amount"}); return; }


        //Fund address
        let fundTx;
        try{
            fundTx=await this.fundingMgr.fundAddr(
                networkId,
                receiver,
                amount,
                verifiedAuthToken.payload.iss.replace("did:ethr:","")
            )
        } catch (error){
            console.log("this.fundingMgr.fundTx() error: "+error.message)
            cb(error.message); return;
        }
        console.log("fundTx: "+fundTx);
        cb(null,fundTx);
        return;
    }

  }
  