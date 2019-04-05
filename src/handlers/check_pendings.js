const networks = require('../lib/networks');

module.exports = class CheckPendingsHandler {
    constructor (ethereumMgr,fundingMgr) {
        this.ethereumMgr=ethereumMgr;
        this.fundingMgr=fundingMgr;
    }

    async handle(event,context, cb) {
        //Just for timestamping the start of the call
        console.log("Start..");

        let promises=[]

        for (const networkId in networks) {
            //Release mined tx in ethereumMgr
            promises.push(this.ethereumMgr.releaseCompleted(networkId))
            
            //Retry pending tx in fundingMgr
            promises.push(this.fundingMgr.retry(networkId))
            
            // do callbacks
            promises.push(this.fundingMgr.doCallbacks(networkId))
        }

        await Promise.all(promises)
        cb(null,"OK")
        return;
    }

  }
  