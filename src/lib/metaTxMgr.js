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

}
module.exports = MetaTxMgr
