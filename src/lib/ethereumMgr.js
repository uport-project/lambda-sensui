import networks from './networks'
import { TxRelay } from 'uport-identity'
import Web3 from 'web3'
import Contract from 'truffle-contract'
import Promise from 'bluebird'
import { Client, Pool } from 'pg'

const txRelayArtifact = TxRelay.v2

const DEFAULT_GAS_PRICE = 20000000000 // 20 Gwei

class EthereumMgr {


  constructor(pgUrl) {
    this.pgUrl=pgUrl

    this.web3s = {}
    this.txRelays = {}
    this.gasPrice = DEFAULT_GAS_PRICE

    this.pool = new Pool({
      connectionString: this.pgUrl,
    })
    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl)
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3
    }
  }

  async getBalance(address, networkName) {
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getDatabaseNonce(address, networkName) {
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')

    const { rows } = await this.pool.query('SELECT nonce FROM nonces WHERE address = $1 and network=$2', [address, networkName])

    return rows[0] ? rows[0].nonce : 0
  }

  async insertDatabaseNonce(address, networkName, nonce, mode='insert'){
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')
    if (!nonce) throw ('no nonce')

    const text = 'INSERT INTO nonces(address, nonce, network) \
            VALUES($1, $2, $3) \
            ON CONFLICT(address) DO UPDATE \
            SET nonce=$2 \
            RETURNING *'

    const values = [address, nonce, networkName]

    try {
      const res = await this.pool.query(text, values)
    } catch (err) {
      console.log(err.stack)
    }
  }

  async getNonce(address, networkName) {
    const dbNonce = await this.getDatabaseNonce(address, networkName)
    const networkNonce = await this.web3s[networkName].eth.getTransactionCountAsync(address)
    console.log('fetching nonce: db', dbNonce, ' net', networkNonce)
    let nonce
    if (dbNonce > networkNonce) {
      nonce = dbNonce
    } else {
      nonce = networkNonce
    }
    await this.insertDatabaseNonce(address, networkName, nonce + 1)
    return nonce
  }

  async sendRawTransaction(signedRawTx, networkName) {
    return await this.web3s[networkName].eth.sendRawTransactionAsync(signedRawTx)
  }

  async getGasPrice(networkName) {
    try {
      this.gasPrice = (await this.web3s[networkName].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrice
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

  async closePool() {
    this.pool.end()
  }
}

module.exports = EthereumMgr
