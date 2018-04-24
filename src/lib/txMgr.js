import Transaction from "ethereumjs-tx";
import TxUtil from "ethereumjs-util";

class TxMgr {
  constructor(ethereumMgr) {
    this.ethereumMgr = ethereumMgr;
  }

  async verify(_tx) {
    if (!_tx) throw "no tx";
    let txObj;
    try {
      txObj = new Transaction(_tx);
    } catch (err) {
      console.error(err);
      throw "Invalid tx:" + err.message;
    }

    let verifySignature = txObj.verifySignature();
    if (!verifySignature) {
      throw "Tx does not verifySignature";
    } else {
      return txObj;
    }
  }

  async decode(_tx) {
    if (!_tx) throw "no tx";
    if (typeof _tx !== "object") {
      throw "no Transaction";
    }

    let from = "0x" + _tx.getSenderAddress().toString("hex");
    let to = TxUtil.bufferToHex(_tx.to);
    let data = TxUtil.bufferToHex(_tx.data);
    let value = TxUtil.bufferToHex(_tx.value);
    let txGasPrice = TxUtil.bufferToInt(_tx.gasPrice);
    let txGasLimit = TxUtil.bufferToInt(_tx.gasLimit);

    let decodedObj = {
      from: from,
      to: to,
      data: data,
      value: value,
      gasPrice: txGasPrice,
      gasLimit: txGasLimit
    };

    return decodedObj;
  }
}
module.exports = TxMgr;
