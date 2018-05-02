
class CheckPendingHandler {
    constructor (ethereumMgr) {
      this.ethereumMgr = ethereumMgr
    }
  
    async handle(event, context, cb) {
      let body;
  
      if (event && !event.body){
        body = event
      } else if (event && event.body) {
        try {
          body = JSON.parse(event.body)
        } catch (e) {
          cb({ code: 400, message: 'no json body'})
          return;
        }
      } else {
        cb({code: 400, message: 'no json body'})
        return;
      }
  
      if (!body.blockchain) {
        cb ({code: 400, message: 'blockchain parameter missing'})
        return;
      }

      let age=365*24*60*60;
      if (body.age) {
          age=body.age;
      }
      
      let txHashes;
      try{
        console.log("calling ethereumMgr.getPendingTx")
        const dbRes = await this.ethereumMgr.getPendingTx(body.blockchain,age) 
        txHashes = dbRes.rows;
      } catch(err) {
        console.log("Error on this.ethereumMgr.getPendingTx")
        console.log(err)
        cb({ code: 500, message: err })
        return;
      }

      //console.log(txHashes);
      let promises=[];
      txHashes.forEach((row)=>{
        console.log(row.tx_hash);
        promises.push(
            this.ethereumMgr.getTransactionReceipt(row.tx_hash,body.blockchain)
        );
      })
      
      
      let promisesRes = await Promise.all(promises);
      //console.log(promisesRes);
      
      cb(null, 'OK')
      return;
  }
}
module.exports = CheckPendingHandler;
