

class FundHandler {
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
  
      if (!body.tx) {
        cb ({code: 400, message: 'tx parameter missing'})
        return;
      }
      if (!body.blockchain) {
        cb ({code: 400, message: 'blockchain parameter missing'})
        return;
      }
     
      // support hex strings starting with 0x
      if (body.tx.startsWith('0x')) {
        body.tx= body.tx.slice(2)
      }
      

      //Verify Tx
      let tx;
      try{
        tx = await this.txMgr.verify(body.tx)
      } catch(err) {
        console.log("Error on this.txMgr.verify")
        console.log(err)
        cb({ code: 400, message: err.message })
        return;
      }

      let decodedTx;
      try{
        decodedTx = await this.txMgr.decode(body.tx)
      } catch(err) {
        console.log("Error on this.txMgr.decode")
        console.log(err)
        cb({ code: 400, message: err.message })
        return;
      }



      cb ({code: 500, message: 'not implemented'})
      return;
    

    }
  
  }
  module.exports = FundHandler
  