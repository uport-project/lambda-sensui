import { TxRelay } from 'uport-identity'
import Contract from 'truffle-contract'
import { signers } from 'eth-signer'


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
    console.log('network nonce: ' + nonce)
    console.log(typeof (nonce))
    return nonce.toString(16)
  }

  async isMetaSignatureValid({metaSignedTx, blockchain, metaNonce}) {
    if(!metaSignedTx) throw('no metaSignedTx')
    if(!blockchain) throw('no blockchain')
    const decodedTx = TxRelaySigner.decodeMetaTx(metaSignedTx)
    const relayerAddress = await this.getRelayerAddress(blockchain)
    let nonce = await this.getRelayNonce(decodedTx.claimedAddress, blockchain)
    if (metaNonce !== undefined && metaNonce > nonce) {
      nonce = metaNonce.toString()
    }
    console.log('chosen nonce: ' + nonce)
    const validMetaSig = TxRelaySigner.isMetaSignatureValid(relayerAddress, decodedTx, nonce)
    return validMetaSig
  }

  async decodeMetaTx(metaSignedTx) {
    if(!metaSignedTx) throw('no metaSignedTx')
    return TxRelaySigner.decodeMetaTx(metaSignedTx)
  }

}
module.exports = MetaTxMgr
