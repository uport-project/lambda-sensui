/*
file - metaTxMgr.js - handles metatx

resources:
- uport-identity - uPort Contracts for managing identity
https://github.com/uport-project/uport-identity

TX-relay:
TxRelay is a contract that provides the uPort contract system with meta transactions.
Meta-tx are a way for a user to sign some data, and then another person/service to relay
this data to the Ethereum network. This has the benefit of allowing “unfunded” keys to
exist and transact on the Ethereum network without the difficulty of funding them.
Instead the person/service relaying the transaction will pay for the gas cost.
https://github.com/uport-project/uport-identity/blob/develop/docs/txRelay.md

- truffle-contract - A better Ethereum contract abstraction, for Node and the browser
https://github.com/trufflesuite/truffle-contract

- eth-signer - A minimal ethereum javascript signer used to sign and send meta tx
https://github.com/ConsenSys/eth-signer
*/
const { TxRelay }=require("uport-identity");
const Contract=require("truffle-contract");
const { signers }=require("eth-signer");

const txRelayArtifact = TxRelay.v2;
const TxRelaySigner = signers.TxRelaySigner;

class MetaTxMgr {

  //takes in instance of ethereumMgr
  constructor(ethereumMgr) {
    this.txRelayers = {};
    this.ethereumMgr = ethereumMgr;
  }

  //checking for valid network
  async initTxRelayer(networkName) {
    if (!networkName) throw "no networkName";
    if (!this.txRelayers[networkName]) {
      let TxRelayContract = new Contract(txRelayArtifact);
      let provider = this.ethereumMgr.getProvider(networkName);
      if (provider == null) throw "null provider";
      TxRelayContract.setProvider(provider);
      this.txRelayers[networkName] = await TxRelayContract.deployed();
    }
  }

  async getRelayerAddress(networkName) {
    await this.initTxRelayer(networkName);
    return this.txRelayers[networkName].address;
  }

  async getRelayNonce(address, networkName) {
    if (!address) throw "no address";
    await this.initTxRelayer(networkName);
    let nonce = await this.txRelayers[networkName].getNonce(address);
    console.log("network nonce: " + nonce);
    console.log(typeof nonce);
    return nonce.toString(16);
  }

  async isMetaSignatureValid({ metaSignedTx, blockchain, metaNonce }) {
    if (!metaSignedTx) throw "no metaSignedTx";
    if (!blockchain) throw "no blockchain";
    let decodedTx;
    let relayerAddress
    try{
      decodedTx = TxRelaySigner.decodeMetaTx(metaSignedTx);
      relayerAddress = await this.getRelayerAddress(blockchain);
      console.log(decodedTx);
    }catch(err){
      console.log("Error on  TxRelaySigner.decodeMetaTx or getRelayerAddress")
      console.log(err)
      return false;
    }

    if(decodedTx.claimedAddress=='0x'){
      console.log("no claimedAddress")
      return false;
    }

    let nonce;
    try{
      nonce = await this.getRelayNonce(decodedTx.claimedAddress, blockchain);
    }catch(err){
      console.log("Error on getRelayNonce")
      console.log(err)
      return false;
    }
    if (metaNonce !== undefined && metaNonce > nonce) {
      nonce = metaNonce.toString();
    }
    console.log("chosen nonce: " + nonce);
    try{
      const validMetaSig = TxRelaySigner.isMetaSignatureValid(
        relayerAddress,
        decodedTx,
        nonce
      );
      return validMetaSig;
    }catch(err){
      console.log("Error on TxRelaySigner.isMetaSignatureValid")
      console.log(err)
      return false;
    }
  }

  async decodeMetaTx(metaSignedTx) {
    if (!metaSignedTx) throw "no metaSignedTx";
    return TxRelaySigner.decodeMetaTx(metaSignedTx);
  }
}
module.exports = MetaTxMgr;
