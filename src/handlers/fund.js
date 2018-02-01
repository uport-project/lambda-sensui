

class FundHandler {
    constructor (authMgr,txMgr,ethereumMgr) {
      this.authMgr = authMgr
      this.txMgr = txMgr
      this.ethereumMgr = ethereumMgr
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
      let txObj;
      try{
        txObj = await this.txMgr.verify(body.tx)
      } catch(err) {
        console.log("Error on this.txMgr.verify")
        console.log(err)
        cb({ code: 400, message: err.message })
        return;
      }

      let decodedTx;
      try{
        decodedTx = await this.txMgr.decode(txObj)
      } catch(err) {
        console.log("Error on this.txMgr.decode")
        console.log(err)
        cb({ code: 400, message: err.message })
        return;
      }

      //Verify auth and tx.from
      if(authToken.sub !== decodedTx.from){
        console.log("authToken.sub !== decodedTx.from")
        cb({ code: 403, message: 'Auth token mismatch. Does not match `from` field in tx' })
        return;
      }

      //Check if it is abusing GasPrice
      let blockchainGasPrice;
      try{
        blockchainGasPrice = await this.ethereumMgr.getGasPrice(body.blockchain)
      } catch(err) {
        console.log("Error on this.ethereumMgr.getGasPrice")
        console.log(err)
        cb({ code: 500, message: err.message })
        return;
      }
    
      if(decodedTx.gasPrice > (blockchainGasPrice * 50)){
        console.log("abusing gasPrice")
        cb({ code: 429, message: 'tx.gasPrice too high. Not funding.' })
        return;
      }

      //Get balance of address tx.from
      let fromBalance;
      try{
        fromBalance = await this.ethereumMgr.getBalance(decodedTx.from,body.blockchain)
      } catch(err) {
        console.log("Error on this.ethereumMgr.getBalance")
        console.log(err)
        cb({ code: 500, message: err.message })
        return;
      }

      let txNeeded = decodedTx.gasPrice * decodedTx.gasLimit;
      let txNeededTolerance  = txNeeded * 1.05; //TODO: Change 1.05 to ENV_VAR. No magic numbers!

      //Check if funds are needed
      if ( parseInt(fromBalance) > txNeededTolerance ){
        console.log("enough balance. Not sending funds")
        cb({ code: 429, message: 'enough balance. Not sending funds' })
        return;
      }

      //Send fundingTx
      let topUpTo = txNeeded * 1.5;
      let amountToFund = topUpTo - fromBalance

      let fundingTx = {
        to: decodedTx.from,
        value: amountToFund
      }
      let txHash;
      try{
        txHash = await this.ethereumMgr.sendTransaction(fundingTx,body.blockchain)
      } catch(err) {
        console.log("Error on this.ethereumMgr.sendTransaction")
        console.log(err)
        cb({ code: 500, message: err.message })
        return;
      }
      
      cb (null,txHash)
      return;
    }
  
  }
  module.exports = FundHandler
  