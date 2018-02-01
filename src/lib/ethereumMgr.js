import networks from './networks'
import Web3 from 'web3'
import Promise from 'bluebird'
import { generators, signers } from 'eth-signer'
import Transaction from 'ethereumjs-tx'
import { Client } from 'pg'

const HDSigner = signers.HDSigner

const DEFAULT_GAS_PRICE = 20000000000 // 20 Gwei

class EthereumMgr {

  constructor() {
    this.pgUrl=null
    this.seed=null

    this.web3s = {}

    this.gasPrices = {}

    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl)
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3

      this.gasPrices[network]= DEFAULT_GAS_PRICE;
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
    if(!this.web3s[networkName]) return null;
    return this.web3s[networkName].currentProvider
  }

  getAddress(){
    return this.signer.getAddress()
  }

  async getBalance(address, networkName) {
    if(!address) throw('no address')
    if(!networkName) throw('no networkName')
    if(!this.web3s[networkName]) throw('no web3 for networkName')
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getGasPrice(networkName) {
    if(!networkName) throw('no networkName')
    try {
      this.gasPrices[networkName] = (await this.web3s[networkName].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrices[networkName]
  }

  async estimateGas(tx, from, networkName) {
    if(!tx) throw('no tx object')
    if(!networkName) throw('no networkName')

    //let tx = new Transaction(Buffer.from(txHex, 'hex'))
    let txCopy = {
      nonce: '0x' + (tx.nonce.toString('hex') || 0),
      gasPrice: '0x' + tx.gasPrice.toString('hex'),
      to: '0x' + tx.to.toString('hex'),
      value: '0x' + (tx.value.toString('hex') || 0),
      data: '0x' + tx.data.toString('hex'),
      from
    }
    let price = 3000000
    try {
      price = await this.web3s[networkName].eth.estimateGasAsync(txCopy)
    } catch (error) {}
    return price
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
            "INSERT INTO nonces(address,network,nonce) \
             VALUES ($1,$2,0) \
        ON CONFLICT (address,network) DO UPDATE \
              SET nonce = nonces.nonce + 1 \
            WHERE nonces.address=$1 \
              AND nonces.network=$2 \
        RETURNING nonce;"
            , [address, networkName]);
        return res.rows[0].nonce;
    } catch (e){
        throw(e);
    } finally {
        await client.end()
    }
  }


  async signTx({txHex, blockchain}) {
    if(!txHex) throw('no txHex')
    if(!blockchain) throw('no blockchain')
    let tx = new Transaction(Buffer.from(txHex, 'hex'))
    tx.gasPrice = await this.getGasPrice(blockchain)
    tx.nonce = await this.getNonce(this.signer.getAddress(), blockchain)
    const estimatedGas = await this.estimateGas(tx, this.signer.getAddress(), blockchain)
    // add some buffer to the limit
    tx.gasLimit = estimatedGas + 1000
    //console.log('limit', parseInt(tx.gasLimit.toString('hex'), 16))

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
    if(!signedRawTx) throw('no signedRawTx')
    if(!networkName) throw('no networkName')

    console.log(signedRawTx)
    if (!signedRawTx.startsWith('0x')) {
      signedRawTx= '0x'+signedRawTx
    }
    return await this.web3s[networkName].eth.sendRawTransactionAsync(signedRawTx)
  }

  async sendTransaction(txObj,networkName){
    if(!txObj) throw('no txObj')
    if(!networkName) throw('no networkName')

    let tx = new Transaction(txObj)
    const rawTx = tx.serialize().toString('hex')
    let signedRawTx = await this.signTx({txHex: rawTx, blockchain: networkName})
    return await this.sendRawTransaction(signedRawTx,networkName);

  }

}

module.exports = EthereumMgr
