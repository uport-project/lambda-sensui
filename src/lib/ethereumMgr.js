import networks from './networks'
import Web3 from 'web3'
import Promise from 'bluebird'
import { generators, signers } from 'eth-signer'

import { Client } from 'pg'

const HDSigner = signers.HDSigner

const DEFAULT_GAS_PRICE = 20000000000 // 20 Gwei

class EthereumMgr {

  constructor() {
    this.pgUrl=null
    this.seed=null

    this.web3s = {}
    
    this.gasPrice = DEFAULT_GAS_PRICE

    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl)
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3
    }
  }

  isSecretsSet(){
      return (this.pgUrl !== null || this.seed !== null);
  }

  setSecrets(secrets){
      this.pgUrl=secrets.PG_URL;
      this.seed=secrets.SEED;
  
      const hdPrivKey = generators.Phrase.toHDPrivateKey(this.seed)
      this.signer = new HDSigner(hdPrivKey)
  
  }

  getProvider(networkName) {
    return this.web3s[networkName].currentProvider
  }  

  async getBalance(address, networkName) {
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getGasPrice(networkName) {
    try {
      this.gasPrice = (await this.web3s[networkName].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrice
  }

  async getNonce(address, networkName) {
    if(!address) throw('no address')    
    if(!networkName) throw('no networkName')    
    if(!this.pgUrl) throw('no pgUrl set')

    const client = new Client({
        connectionString: this.pgUrl,
    })

    try{
        await client.connect()
        const res=await client.query(
            "UPDATE nonces \
                SET nonce = nonce + 1 \
              WHERE address = $1 AND network=$2 \
            RETURNING nonce;"
            , [address, networkName]);
        return res.rows[0] ? res.row[0] : 0;
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }
 

  async signTx({txHex, blockchain}) {
    let tx = new Transaction(Buffer.from(txHex, 'hex'))
    // TODO - set correct gas Limit
    tx.gasLimit = 3000000
    tx.gasPrice = await this.getGasPrice(blockchain)
    
    tx.nonce = await this.getNonce(this.signer.getAddress(), blockchain)
    
    const rawTx = tx.serialize().toString('hex')
    return new Promise((resolve, reject) => {
      this.signer.signRawTx(rawTx, (error, signedRawTx) => {
        if (error) {
          reject(error)
        }
        resolve(signedRawTx)
      })
    })
  }

  async sendRawTransaction(signedRawTx, networkName) {
    return await this.web3s[networkName].eth.sendRawTransactionAsync(signedRawTx)
  }

/*
  async getDatabaseNonce(address, networkName) {
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')

    const { rows } = await this.pool.query()

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

 */
 
 
}

module.exports = EthereumMgr
