const networks = require('../lib/networks');

module.exports = class NewBlockHandler {
    constructor (ethereumMgr,fundingMgr) {
        this.ethereumMgr=ethereumMgr;
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


        //Release mined tx in ethereumMgr
        try {
            await this.ethereumMgr.releaseCompleted(networkId);
        } catch (error) {
            console.log(error);
            cb({code: 500, message: error.message}); return;
        }
        
        //Retry pending tx in fundingMgr
        try {
            await this.fundingMgr.retry(networkId);
        } catch (error) {
            console.log(error);
            cb({code: 500, message: error.message}); return;
        }

        cb(null,"OK")
        return;
    }

  }
  