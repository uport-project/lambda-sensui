import networks from './networks'
import { TxRelay } from 'uport-identity'
import Web3 from 'web3'
import Contract from 'truffle-contract'
import Promise from 'bluebird'
import { Client } from 'pg'
import { networkInterfaces } from 'os';

const txRelayArtifact = TxRelay.v2


class EthereumMgr {


  constructor(pgUrl) {
    this.pgUrl=pgUrl
    this.web3s = {}
    this.txRelays = {}
    this.txCount = {}
    this.client = new Client({
      connectionString: this.pgUrl,
    })
    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl)
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3
      this.txCount[network] = {}
    }
  }

  async getNonceFromDB(networkName) {
    if (!networkName) throw ('no networkName')

    try {
      await this.client.connect()
      const res = await this.client.query(
        "SELECT txcount \
          FROM transactions_count \
          WHERE network_name='$1'"
        , networkName);
      return res.rows[0];
    } catch (e) {
      throw (e);
    } finally {
      await this.client.end()
    }
  }

  async getBalance(address, networkName) {
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getNonce(address, networkName) {
    let nonce = await this.getNonceFromDB(networkName)
    if (this.txCount[networkName][address] > nonce) {
      nonce = this.txCount[networkName][address]
      this.txCount[networkName][address]++
    } else {
      this.txCount[networkName][address] = nonce + 1
    }
    this.saveNonce(networkName)
    console.log(address, 'nonce:', nonce)
    return nonce
  }

  async saveNonce(networkName){
    try {
      await this.client.connect()
      const res = await this.client.query(
        "INSERT INTO transactions_count(network, txcount) \
          VALUES ($1, $2)"
          ,[networkName, this.txCount[networkName][address]]);
    } catch (e) {
      throw (e);
    } finally {
      await this.client.end()
    }
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
