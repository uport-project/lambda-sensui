

class RelayHandler {
  constructor (authMgr,ethereumMgr,metaTxMgr) {
    this.authMgr = authMgr
    this.ethereumMgr = ethereumMgr
    this.metaTxMgr = metaTxMgr
  }

  async handle(event, context, cb) {
    let authToken;
    try{
      authToken = await this.authMgr.verifyNisaba(event)
    } catch(err) {
      console.log("Error on this.authMgr.verifyNisaba")
      console.log(err)
      cb({ code: 401, message: err.message })
      return;
    }

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

    if (!body.metaSignedTx) {
      cb ({code: 400, message: 'metaSignedTx parameter missing'})
      return;
    }
    if (!body.blockchain) {
      cb ({code: 400, message: 'blockchain parameter missing'})
      return;
    }
   
    // support hex strings starting with 0x
    if (body.metaSignedTx.startsWith('0x')) {
      body.metaSignedTx= body.metaSignedTx.slice(2)
    }

    //Check if metaTx signature is valid
    if (!(await this.metaTxMgr.isMetaSignatureValid(body))) {
      cb({code: 403, message: 'MetaTx signature invalid'})
      return;
    }

    let metaTxFrom;
      try{
        metaTxFrom = await this.metaTxMgr.getMetaTxFrom(body)
      } catch(err) {
        console.log("Error on this.metaTxMgr.getMetaTxFrom")
        console.log(err)
        cb({ code: 403, message: err.message })
        return;
      }

    //Verify auth and metaTx.from
    if(authToken.sub !== metaTxFrom){
      console.log("authToken.sub !== metaTxFrom")
      cb({ code: 403, message: 'Auth token mismatch. Does not match `from` field in metatx' })
      return;
    }

    let signedRawTx;
    try{
      signedRawTx = await this.ethereumMgr.signTx({
        txHex:body.metaSignedTx, 
        blockchain: body.blockchain
      })
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
