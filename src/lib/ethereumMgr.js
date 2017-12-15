import networks from './networks'
import { TxRelay } from 'uport-identity'
import Web3 from 'web3'
import Contract from 'truffle-contract'
import Promise from 'bluebird'
import { Client } from 'pg'

const txRelayArtifact = TxRelay.v2


class EthereumMgr {


  constructor(pgUrl) {
    this.pgUrl=pgUrl

    this.web3s = {}
    this.txRelays = {}
    this.client = new Client({
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


  async getDatabaseNonce(address, networkName){
    if(!address) throw ('no address')
    if(!networkName) throw ('no networkName')
    try {
      await this.client.connect()
      const res = await this.client.query(
        "SELECT nonce \
          FROM nonces \
          WHERE address='$1' \
          and network_name='$2'",
        [address, networkName])
      return res.rows[0];
    } catch(e){
      throw(e);
    } finally {
      await this.client.end()
    }
  }

  async updateDatabaseNonce(address, networkName, nonce){
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')
    if (!nonce) throw ('no nonce')
    try {
      await this.client.connect()
      if(!this.getDatabaseNonce(address, networkName)){
        //insert row since it doesn't exist on db
        const res = await this.client.query(
          "INSERT INTO nonces(address,nonce,network_name) \
          VALUES('$1',$2,'$3') RETURNING nonces",
          [address, 0, networkName])
      } else {
        const res = await this.client.query(
          "UPDATE nonces \
          SET nonce=$2 \
          WHERE address='$1' \
          AND network_name='$3' \
          RETURNING nonces",
          [address, nonce, networkName])
      }
    } catch (e) {
      throw (e);
    } finally {
      await this.client.end()
    }

  }

  async getNonce(address, networkName) {
    let dbNonce = await this.getDatabaseNonce(address, networkName)
    let networkNonce = await this.web3s[networkName].eth.getTransactionCountAsync(address)
    if (dbNonce > networkNonce) {
      this.updateDatabaseNonce(address, networkName, dbNonce+1)
    } else {
      this.updateDatabaseNonce(address, networkName, networkNonce + 1)
    }
    console.log(address, 'nonce:', networkNonce)
    return networkNonce
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
