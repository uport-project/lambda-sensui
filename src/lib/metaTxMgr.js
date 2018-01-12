import { TxRelay } from 'uport-identity'
import Contract from 'truffle-contract'
import { signers } from 'eth-signer'

import util from 'ethereumjs-util'
import leftPad from 'left-pad'
import solsha3 from 'solidity-sha3'

const txRelayArtifact = TxRelay.v2
const TxRelaySigner = signers.TxRelaySigner

class MetaTxMgr {

  constructor(ethereumMgr) {
    this.txRelayers = {}
    this.ethereumMgr=ethereumMgr;
  }

  async initTxRelayer(networkName) {
    if(!networkName) throw('no networkName')
    if (!this.txRelayers[networkName]) {
      let TxRelayContract = new Contract(txRelayArtifact)
      let provider=this.ethereumMgr.getProvider(networkName)
      if(provider==null) throw ('null provider')
      TxRelayContract.setProvider(provider)
      this.txRelayers[networkName] = await TxRelayContract.deployed()
    }
  }

  async getRelayerAddress(networkName) {
    await this.initTxRelayer(networkName)
    return this.txRelayers[networkName].address
  }

  async getRelayNonce(address, networkName) {
    if(!address) throw('no address')
    await this.initTxRelayer(networkName)
    let nonce = await this.txRelayers[networkName].getNonce(address)
    return nonce.toString()
  }

  async isMetaSignatureValid({metaSignedTx, blockchain}) {
    if(!metaSignedTx) throw('no metaSignedTx')
    if(!blockchain) throw('no blockchain')
    const decodedTx = TxRelaySigner.decodeMetaTx(metaSignedTx)
    const relayerAddress = await this.getRelayerAddress(blockchain)
    const nonce = await this.getRelayNonce(decodedTx.claimedAddress, blockchain)
    const validMetaSig = TxRelaySigner.isMetaSignatureValid(relayerAddress, decodedTx, nonce)
    return validMetaSig
  }

  async getMetaTxFrom({metaSignedTx, blockchain}){
    if(!metaSignedTx) throw('no metaSignedTx')
    if(!blockchain) throw('no blockchain')
    const decodedTx = TxRelaySigner.decodeMetaTx(metaSignedTx)
    const relayerAddress = await this.getRelayerAddress(blockchain)
    const nonce = await this.getRelayNonce(decodedTx.claimedAddress, blockchain)


    //TODO: This should be on eth-signer
    let hashInput = '0x1900' + util.stripHexPrefix(relayerAddress) + util.stripHexPrefix(decodedTx.whitelistOwner)
                  + this.pad(nonce) + decodedTx.to + decodedTx.data
    let msgHash = solsha3(hashInput);
    let pubkey = util.ecrecover(Buffer.from(util.stripHexPrefix(msgHash), 'hex'), decodedTx.v, decodedTx.r, decodedTx.s);
    let address = '0x' + util.pubToAddress(pubkey).toString('hex');

    return address;

  }

  pad(n) {
    if (n.startsWith('0x')) {
      n = util.stripHexPrefix(n);
    }
    return leftPad(n, '64', '0');
  }
  

}
module.exports = MetaTxMgr
