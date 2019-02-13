/*
file - txMgr.js - getting transaction details and verifying tx 

resources:
- ethereumjs-tx - A simple module for creating, manipulating and signing ethereum transactions
https://github.com/ethereumjs/ethereumjs-tx

- ethereumjs-util - A collection of utility functions for Ethereum
https://github.com/ethereumjs/ethereumjs-util
*/
const Transaction = require("ethereumjs-tx");
const TxUtil = require("ethereumjs-util");

class TxMgr {
  //takes in an instance of ethereum manager
  constructor(ethereumMgr) {
    this.ethereumMgr = ethereumMgr;
  }

  //verifying transaction that was made and seeing if it was signed
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

  //get details of the transaction and returning them
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
