/*
file: fund.js - to fund the fund address (which funds signed metatx)
method: fund
needed parameters in url endpoint:
- tx
- blockchain

activates fundhandler, which takes the following inputs (which are instatited
at the top of the file):
- authMgr
- ethereumMgr
- metaTxMgr

Purpose: this activates the handle method in handlers/fund.js, which verifies the tx with
txMgr, decodes the transaction, verifies who the transaction is from, check if it
is abusing the gas price by not funding any transaction with a set gas price of ethereum's
trending gas price * 50 (i.e. blockchainGasPrice * 50), gets the balance of the Address
to check if it's real/instatiated and check if funds are needed in the funder address, and then
sends funds to the funding address (if more funds is needed)
*/
class FundHandler {
  constructor(authMgr, txMgr, ethereumMgr) {
    this.authMgr = authMgr;
    this.txMgr = txMgr;
    this.ethereumMgr = ethereumMgr;
  }

  async handle(event, context, cb) {
    let authToken;
    try {
      authToken = await this.authMgr.verifyFuelToken(event);
    } catch (err) {
      console.log("Error on this.authMgr.verifyFuelToken");
      console.log(err);
      cb({ code: 401, message: err.message });
      return;
    }

    let body;

    if (event && !event.body) {
      body = event;
    } else if (event && event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        cb({ code: 400, message: "no json body" });
        return;
      }
    } else {
      cb({ code: 400, message: "no json body" });
      return;
    }

    if (!body.tx) {
      cb({ code: 400, message: "tx parameter missing" });
      return;
    }
    if (!body.blockchain) {
      cb({ code: 400, message: "blockchain parameter missing" });
      return;
    }

    // support hex strings starting with 0x
    if (body.tx.startsWith("0x")) {
      body.tx = body.tx.slice(2);
    }

    //Verify Tx
    let txObj;
    try {
      txObj = await this.txMgr.verify(body.tx);
    } catch (err) {
      console.log("Error on this.txMgr.verify");
      console.log(err);
      cb({ code: 400, message: err.message });
      return;
    }

    let decodedTx;
    try {
      decodedTx = await this.txMgr.decode(txObj);
    } catch (err) {
      console.log("Error on this.txMgr.decode");
      console.log(err);
      cb({ code: 400, message: err.message });
      return;
    }

    //Verify auth and tx.from
    if (authToken.sub.toLowerCase() !== decodedTx.from.toLowerCase()) {
      console.log("authToken.sub !== decodedTx.from");
      console.log("authToken.sub  :"+authToken.sub.toLowerCase());
      console.log("decodedTx.from :"+decodedTx.from.toLowerCase());
      cb({
        code: 403,
        message: "Auth token mismatch. Does not match `from` field in tx"
      });
      return;
    }

    //Check if it is abusing GasPrice
    let blockchainGasPrice;
    try {
      blockchainGasPrice = await this.ethereumMgr.getGasPrice(body.blockchain);
    } catch (err) {
      console.log("Error on this.ethereumMgr.getGasPrice");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    if (decodedTx.gasPrice > blockchainGasPrice * 50) {
      console.log("abusing gasPrice");
      cb({ code: 429, message: "tx.gasPrice too high. Not funding." });
      return;
    }

    //Get balance of address tx.from
    let fromBalance;
    try {
      fromBalance = await this.ethereumMgr.getBalance(
        decodedTx.from,
        body.blockchain
      );
    } catch (err) {
      console.log("Error on this.ethereumMgr.getBalance");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    let txNeeded = decodedTx.gasPrice * decodedTx.gasLimit;
    let txNeededTolerance = txNeeded * 1.05; //TODO: Change 1.05 to ENV_VAR. No magic numbers!

    //Check if funds are needed
    if (parseInt(fromBalance) > txNeededTolerance) {
      console.log("enough balance. Not sending funds");
      cb({ code: 429, message: "enough balance. Not sending funds" });
      return;
    }

    //Send fundingTx
    let topUpTo = txNeeded * 1.5;
    let amountToFund = topUpTo - fromBalance;

    let fundingTx = {
      to: decodedTx.from,
      value: amountToFund
    };
    let txHash;
    try {
      txHash = await this.ethereumMgr.sendTransaction(
        fundingTx,
        body.blockchain
      );
    } catch (err) {
      console.log("Error on this.ethereumMgr.sendTransaction");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    cb(null, txHash);
    return;
  }
}
module.exports = FundHandler;
