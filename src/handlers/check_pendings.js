const networks = require('../lib/networks');

module.exports = class CheckPendingsHandler {
    constructor (ethereumMgr,fundingMgr) {
        this.ethereumMgr=ethereumMgr;
        this.fundingMgr=fundingMgr;
    }

    async handle(event,context, cb) {
        //Just for timestamping the start of the call
        console.log("Start..");

        for (const networkId in networks) {
            console.log("Checking on networkId: "+networkId);
            //Release mined tx in ethereumMgr
            try {
                await this.ethereumMgr.releaseCompleted(networkId);
            } catch (error) {
                console.log(error);
                cb(error); return;
            }
            
            //Retry pending tx in fundingMgr
            try {
                await this.fundingMgr.retry(networkId);
            } catch (error) {
                console.log(error);
                cb(error); return;
            }

            // do callbacks
            try {
                await this.fundingMgr.doCallbacks(networkId);
            } catch (error) {
                console.log(error);
                cb(error); return;
            }
            
        }
        cb(null,"OK")
        return;
    }

  }
  