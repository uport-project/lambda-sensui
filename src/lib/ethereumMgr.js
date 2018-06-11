/*
file - ethereumMgr.js - manages interactions with ethereum across the board

resources:
- networks - the various ethereum networks using infura (where key is appended)

- web3 - web3.js is a collection of libraries which allow you to interact with a local
or remote ethereum node, using a HTTP or IPC connection
https://github.com/ethereum/web3.js/

- bluebird - third party promise library
http://bluebirdjs.com/docs/getting-started.html

- eth-signer - A minimal ethereum javascript signer used to sign and send meta tx
https://github.com/ConsenSys/eth-signer

- ethers - This library (which was made for and used by ethers.io) is designed to
make it easier to write client-side JavaScript based wallets, keeping the private
key on the owner’s machine at all times
https://docs.ethers.io/ethers.js/html/api-wallet.html

- pg - node-postgres is a collection of node.js modules for interfacing with your PostgreSQL
database. It has support for callbacks, promises, async/await, connection pooling,
prepared statements, cursors, streaming results, C/C++ bindings, rich type parsing,
and more! Just like PostgreSQL itself there are a lot of features:
this documentation aims to get you up and running quickly and in the right direction.
It also tries to provide guides for more advanced & edge-case topics allowing you to
tap into the full power of PostgreSQL from node.js.
https://node-postgres.com/
*/
import networks from "./networks";
import Web3 from "web3";
import Promise from "bluebird";
import { generators, signers } from "eth-signer";
import Transaction from "ethereumjs-tx";
import { Wallet } from "ethers";
import { Client } from "pg";

/*
from ethsigner library, https://github.com/ConsenSys/eth-signer/blob/master/lib/hd_signer.js
takes in private key, creates simple signer
*/
const HDSigner = signers.HDSigner;

const DEFAULT_GAS_PRICE = 20000000000; // 20 Gwei

class EthereumMgr {
  constructor() {
    this.pgUrl = null;
    this.seed = null;

    this.web3s = {};

    this.gasPrices = {};

    for (const network in networks) {
      let provider = new Web3.providers.HttpProvider(networks[network].rpcUrl);
      let web3 = new Web3(provider);
      web3.eth = Promise.promisifyAll(web3.eth);
      this.web3s[network] = web3;

      this.gasPrices[network] = DEFAULT_GAS_PRICE;
    }
  }

  isSecretsSet() {
    return this.pgUrl !== null || this.seed !== null;
  }

  setSecrets(secrets) {
    /*
      VERY IMPORTANT - THIS IS HOW WE SEND TX WITH SERVICE OF USER
        1. Sets PG_URL so that we can send database queries (from our encrypted secrets)
        2. Sets the wallet seed from our encrypted secrets (the funding wallet seed)
        3. Uses HDPrivateKey repo to do appropiate signer activities
    */
    this.pgUrl = secrets.PG_URL;
    this.seed = secrets.SEED;

    const hdPrivKey = generators.Phrase.toHDPrivateKey(this.seed);
    this.signer = new HDSigner(hdPrivKey);
  }

  getProvider(networkName) {
    if (!this.web3s[networkName]) return null;
    return this.web3s[networkName].currentProvider;
  }

  getAddress() {
    return this.signer.getAddress();
  }

  async getBalance(address, networkName) {
    if (!address) throw "no address";
    if (!networkName) throw "no networkName";
    if (!this.web3s[networkName]) throw "no web3 for networkName";
    return await this.web3s[networkName].eth.getBalanceAsync(address);
  }

  async getGasPrice(networkName) {
    if (!networkName) throw "no networkName";
    try {
      this.gasPrices[networkName] = (await this.web3s[
        networkName
      ].eth.getGasPriceAsync()).toNumber();
    } catch (e) {
      console.log(e);
    }
    return this.gasPrices[networkName];
  }

  async estimateGas(tx, from, networkName) {
    if (!tx) throw "no tx object";
    if (!networkName) throw "no networkName";

    //let tx = new Transaction(Buffer.from(txHex, 'hex'))
    let txCopy = {
      nonce: "0x" + (tx.nonce.toString("hex") || 0),
      gasPrice: "0x" + tx.gasPrice.toString("hex"),
      to: "0x" + tx.to.toString("hex"),
      value: "0x" + (tx.value.toString("hex") || 0),
      data: "0x" + tx.data.toString("hex"),
      from
    };
    let price = 3000000;
    try {
      price = await this.web3s[networkName].eth.estimateGasAsync(txCopy);
    } catch (error) {}
    return price;
  }

  async getNonce(address, networkName) {
    if (!address) throw "no address";
    if (!networkName) throw "no networkName";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    /*
      Resource Used: AWS RDS - PostgreSQL
      Resource Link: https://aws.amazon.com/rds/postgresql/getting-started/
      Need help with PostgreSQL? http://www.postgresqltutorial.com/
      database scheme:
        table name: nonces
          columns: Address | Network | Nonce
          $1 = 'address' input that was inserted in the getNonce function
          $2 = 'networkName' input that was inserted in the getNonce function

      What does this query statement do?
      It attempts to insert the nonce of each transaction in the nonce table,
      and, if there is a conflict as to the nonce being entered, then it updates
      (https://www.postgresql.org/docs/9.5/static/sql-insert.html#SQL-ON-CONFLICT)
    */
    try {
      await client.connect();
      const res = await client.query(
        "INSERT INTO nonces(address,network,nonce) \
             VALUES ($1,$2,0) \
        ON CONFLICT (address,network) DO UPDATE \
              SET nonce = nonces.nonce + 1 \
            WHERE nonces.address=$1 \
              AND nonces.network=$2 \
        RETURNING nonce;",
        [address, networkName]
      );
      return res.rows[0].nonce;
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }

  /*
    What does SignTx Do?
      creates a new transaction taking in the metaSignedTx txHex
      sets the gasPrice and nonce for the new transaction
      ests the gasLimit to the estimatedgas + 1000
      creates 'rawTx' by serializing the new transaction and converting to hex strings
      signs raw transaction with signer
  */

  async signTx({ txHex, blockchain }) {
    if (!txHex) throw "no txHex";
    if (!blockchain) throw "no blockchain";
    let tx = new Transaction(Buffer.from(txHex, "hex"));
    tx.gasPrice = await this.getGasPrice(blockchain);
    tx.nonce = await this.getNonce(this.signer.getAddress(), blockchain);
    const estimatedGas = await this.estimateGas(
      tx,
      this.signer.getAddress(),
      blockchain
    );
    // add some buffer to the limit
    tx.gasLimit = estimatedGas + 1000;
    //console.log('limit', parseInt(tx.gasLimit.toString('hex'), 16))

    const rawTx = tx.serialize().toString("hex");
    return new Promise((resolve, reject) => {
      this.signer.signRawTx(rawTx, (error, signedRawTx) => {
        if (error) {
          reject(error);
        }
        resolve(signedRawTx);
      });
    });
  }

  async sendRawTransaction(signedRawTx, networkName) {
    if (!signedRawTx) throw "no signedRawTx";
    if (!networkName) throw "no networkName";

    console.log(signedRawTx);
    if (!signedRawTx.startsWith("0x")) {
      signedRawTx = "0x" + signedRawTx;
    }
    const txHash = await this.web3s[networkName].eth.sendRawTransactionAsync(
      signedRawTx
    );

    /*
    Transaction Creation & Signage Process:
      Note: All of this is coordinated by the relay.js file in the handlers folder
      Note: All functions being used are in the EthereumMgr.js file in the library folder
      1. Get initial user input of metaSignedTx and blockchain network
      2. Submit input into SignTx Function and get a signedRawTx via following process:
          1. creates a new transaction taking in the metaSignedTx txHex
          2. sets the gasPrice and nonce for the new transaction
          3. ests the gasLimit to the estimatedgas + 1000
          4. creates 'rawTx' by serializing the new transaction and converting to hex strings
          5. signs raw transaction with signer and returns signedRawTx
      3. Gets txHash from sending raw transction via sendRawTransaction, which does the following
          1. Check if signedRawTx is legit
          2. Using web3js to send transaction on respective blockchain using the follwoing func.
             - eth.sendRawTransactionAsync
          3. Returns txhash of transaction sent on blockchain

    take in the signed raw transaction and convert some crucial elements in the
    new tx object so that the call to web3js will be accepted. The end transaction has
    the following object body:
      tx = {
        txObj.gasLimit,
        txObj.gasPrice,
        txObj.value,
        tx.nonce,
      }
    */
    let txObj = Wallet.parseTransaction(signedRawTx);
    txObj.gasLimit = txObj.gasLimit.toString(16);
    txObj.gasPrice = txObj.gasPrice.toString();
    txObj.value = txObj.value.toString(16);

    await this.storeTx(txHash, networkName, txObj);

    return txHash;
  }

  async sendTransaction(txObj, networkName) {
    if (!txObj) throw "no txObj";
    if (!networkName) throw "no networkName";

    let tx = new Transaction(txObj);
    const rawTx = tx.serialize().toString("hex");
    let signedRawTx = await this.signTx({
      txHex: rawTx,
      blockchain: networkName
    });
    return await this.sendRawTransaction(signedRawTx, networkName);
  }

  async readNonce(address, networkName) {
    if (!address) throw "no address";
    if (!networkName) throw "no networkName";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    console.log("address", address);
    console.log("networkName", networkName);

    try {
      await client.connect();
      const res = await client.query(
        "SELECT nonce \
               FROM nonces \
              WHERE nonces.address=$1 \
                AND nonces.network=$2",
        [address, networkName]
      );
      if (res.rows[0]) {
        return res.rows[0].nonce;
      }
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }

  async setNonce(address, networkName, nonce) {
    if (!address) throw "no address";
    if (!networkName) throw "no networkName";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    try {
      await client.connect();
      const res = await client.query(
        "UPDATE nonces \
                SET nonce=$3 \
              WHERE nonces.address=$1 \
                AND nonces.network=$2",
        [address, networkName, nonce]
      );
      return res;
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }

  async getTransactionCount(address, networkName) {
    if (!address) throw "no address";
    if (!networkName) throw "no networkName";
    if (!this.web3s[networkName]) throw "no web3 for networkName";
    return await this.web3s[networkName].eth.getTransactionCountAsync(address);
  }

  async storeTx(txHash, networkName, txObj) {
    if (!txHash) throw "no txHash";
    if (!networkName) throw "no networkName";
    if (!txObj) throw "no txObj";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    /*
      Resource Used: AWS RDS - PostgreSQL
      Resource Link: https://aws.amazon.com/rds/postgresql/getting-started/
      Need help with PostgreSQL? http://www.postgresqltutorial.com/
      database scheme:
        table name: tx
          columns: TX_HASH | Network | TX_OPTIONS
          $1 = 'txHash' input that was inserted in the storeTx function
          $2 = 'networkName' input that was inserted in the storeTx function
          $3 = 'txObj' input that was inserted in the storeTx function
            - there also seems to be an attribute called txReceipt
    */

    try {
      await client.connect();
      const res = await client.query(
        "INSERT INTO tx(tx_hash, network,tx_options) \
             VALUES ($1,$2,$3) ",
        [txHash, networkName, txObj]
      );
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }

  async getTransactionReceipt(txHash, networkName) {
    if (!txHash) throw "no txHash";
    if (!networkName) throw "no networkName";
    if (!this.web3s[networkName]) throw "no web3 for networkName";
    const txReceipt = await this.web3s[
      networkName
    ].eth.getTransactionReceiptAsync(txHash);

    await this.updateTx(txHash, networkName, txReceipt);

    return txReceipt;
  }

  async updateTx(txHash, networkName, txReceipt) {
    if (!txHash) throw "no txHash";
    if (!networkName) throw "no networkName";
    if (!txReceipt) throw "no txReceipt";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    try {
      await client.connect();
      const res = await client.query(
        "UPDATE tx \
                SET tx_receipt = $2, \
                    updated = now() \
              WHERE tx_hash = $1",
        [txHash, txReceipt]
      );
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }

  async getPendingTx(networkName,age){
    if (!networkName) throw "no networkName";
    if (!age) throw "no age";
    if (!this.pgUrl) throw "no pgUrl set";

    const client = new Client({
      connectionString: this.pgUrl
    });

    try {
      await client.connect();
      const res = await client.query(
        "SELECT tx_hash \
           FROM tx \
          WHERE tx_receipt is NULL \
            AND network = $1 \
            AND created > now() - CAST ($2 AS INTERVAL)",
        [networkName, age+' seconds']
      );
      return res;
    } catch (e) {
      throw e;
    } finally {
      await client.end();
    }
  }
}

module.exports = EthereumMgr;
