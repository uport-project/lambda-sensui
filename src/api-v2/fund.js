
class FundHandler {
    constructor (ethereumMgr) {
      this.ethereumMgr = ethereumMgr
    }
  
    async handle(body, cb) {
      // Check empty body
      if (!body) {
        cb({code: 403, message: 'no body'})
        return
      }
      
      //TODO: do all the magic needed. Any 
      //Any access to the ethereum network
      // should be implemented in lib/EthereumMgr and
      // used here as this.ethereumMgr.getBalance(...) 
      // for example
      
      cb({code:500, message:'function FundHandler.handle() not implemented'})
    }
  
  }
  
  module.exports = FundHandler
  