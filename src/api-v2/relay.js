
class RelayHandler {
  constructor (ethereumMgr) {
    this.ethereumMgr = ethereumMgr
  }

  async handle(event, context, cb) {
    //Parse body

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

    if (!body) {
      cb({code: 400, message: 'no json body'})
      return;
    }
    if (!body.metaSignedTx) {
      cb ({code: 400, message: 'metaSignedTx paramter missing'})
      return;
    }
    if (!body.blockchain) {
      cb ({code: 400, message: 'blockchain paramter missing'})
      return;
    }
    if (!(await this.ethereumMgr.isMetaSignatureValid(body))) {
      cb({code: 403, message: 'Meta signature invalid'})
      return;
    }


    let signedRawTx;
    try{
      signedRawTx = await this.ethereumMgr.signTx(body)
    } catch(err) {
      console.log("Error on this.ethereumMgr.signTx")
      console.log(err)
      cb({ code: 500, message: err.message })
      return;
    }

    try{
      const txHash = await this.ethereumMgr.sendRawTransaction(signedRawTx, body.blockchain)
      cb(null, txHash)
    } catch(err) {
      console.log("Error on this.ethereumMgr.sendRawTransaction")
      console.log(err)
      cb({ code: 500, message: err.message })
      return;
    }

  }

}
module.exports = RelayHandler
