import networks from './networks'
import { TxRelay } from 'uport-identity'
import Web3 from 'web3'
import Contract from 'truffle-contract'
import Promise from 'bluebird'

const txRelayArtifact = TxRelay.v2


class EthereumMgr {


  constructor(pgUrl) {
    this.pgUrl=pgUrl

    this.web3s = {}
    this.txRelays = {}
    this.txCount = {}
    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl)
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3
      this.txCount[network] = {}
    }
  }

  async getBalance(address, networkName) {
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getNonce(address, networkName) {
    let nonce = await this.web3s[networkName].eth.getTransactionCountAsync(address)
    if (this.txCount[networkName][address] > nonce) {
      nonce = this.txCount[networkName][address]
      this.txCount[networkName][address]++
    } else {
      this.txCount[networkName][address] = nonce + 1
    }
    console.log(address, 'nonce:', nonce)
    return nonce
  }

  async sendRawTransaction(signedRawTx, networkName) {
    return await this.web3s[networkName].eth.sendRawTransactionAsync(signedRawTx)
  }

  async getRelayNonce(address, networkName) {
    await this.initTxRelay(networkName)
    let nonce = await this.txRelays[networkName].getNonce(address)
    return nonce.toString()
  }

  async getRelayAddress(networkName) {
    await this.initTxRelay(networkName)
    return this.txRelays[networkName].address
  }

  async initTxRelay(networkName) {
    if (!this.txRelays[networkName]) {
      let TxRelayContract = new Contract(txRelayArtifact)
      TxRelayContract.setProvider(this.web3s[networkName].currentProvider)
      this.txRelays[networkName] = await TxRelayContract.deployed()
    }
  }
}

module.exports = EthereumMgr
