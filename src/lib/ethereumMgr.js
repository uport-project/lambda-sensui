const { EthHdWallet } = require('eth-hd-wallet')
const networks = require('../lib/networks');
const SignerProvider = require("ethjs-provider-signer");
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const { Client } = require ("pg");


//TODO define MIN_GAS_PRICE per network
const MIN_GAS_PRICE = 1000000000; // 1 Gwei

module.exports = class EthereumMgr {

    constructor() {
        this.pgUrl = null;
        this.seed = null;
        
    
        this.eths = {};
        this.gasPrices = {};
        this.addresses = null;
      }
    
      isSecretsSet() {
        return this.pgUrl !== null || this.seed !== null;
      }
    
      setSecrets(secrets) {
        this.pgUrl = secrets.PG_URL;
        this.seed = secrets.SEED;
        
        const wallet = EthHdWallet.fromMnemonic(this.seed);
        //Init root+20 accounts
        this.addresses=wallet.generateAddresses(5);
        this.privateKeys={};

        for(let i=0;i<this.addresses.length;i++){
          this.privateKeys[this.addresses[i]]='0x'+wallet._children[i]
                                        .wallet.getPrivateKey().toString('hex');
        }

        const txSigner = {
          signTransaction: (tx_params, cb) => {
            console.log("----------- SIGN TRANSACTION ----------------------")
            console.log(tx_params);
            console.log("----------- /SIGN TRANSACTION ----------------------")
            
            try{
              const signedRawTx = sign(tx_params, this.privateKeys[tx_params.from])
              console.log("----------- signedRawTx ----------------------")
              console.log(signedRawTx);
              console.log("----------- /signedRawTx ----------------------")
              cb(null,signedRawTx)
            }catch(err){
              cb(err);
            }
          },
          accounts: cb => cb(null, this.addresses)
        };

        //Web3s for all networks
        for (const networkId in networks) {
          let provider = new SignerProvider(networks[networkId].rpcUrl, txSigner);
          const eth = new Eth(provider);
          this.eths[networkId]=eth
    
          this.gasPrices[networkId] = MIN_GAS_PRICE;
        }
      }
    

    //Returns balance in wei (string)
    async getBalance(networkId,address) {
        if (!networkId) throw new Error('no networkId')
        if (!address) throw new Error('no address')
        if (!this.eths[networkId]) throw "no eth for networkId";
        return (await this.eths[networkId].getBalance(address)).toString(10);
    }

    //Return network gas price
    async getGasPrice(networkId) {
        if (!networkId) throw Error("no networkId");
        if (!this.eths[networkId]) throw Error("no eth for networkId");
        
        try {
          const networkGasPrice = (await this.eths[networkId].gasPrice()).toNumber();
          if(networkGasPrice > MIN_GAS_PRICE)
            this.gasPrices[networkId] = networkGasPrice;
          else
            this.gasPrices[networkId] = MIN_GAS_PRICE;
        } catch (e) {
          console.log("getGasPrice ERROR:")
          console.log(e);
        }
        return this.gasPrices[networkId];
      }

    //Return contract object
    async getContract(networkId,abi) {
      if (!networkId) throw Error("no networkId");
      if (!abi) throw Error("no abi");
      if (!this.eths[networkId]) throw Error("no eth for networkId");
      return (new EthContract(this.eths[networkId]))(abi);
    }

    //Return the transactionCount for an address (to fill the nonce)
    async getTransactionCount(networkId, address) {
      if (!networkId) throw Error("no networkId");
      if (!address) throw "no address";
      if (!this.eths[networkId]) throw Error("no eth for networkId");
      return (await this.eths[networkId].getTransactionCount(address)).toNumber()
    }

    async getTransactionReceipt(networkId, address) {
      if (!networkId) throw Error("no networkId");
      if (!address) throw "no address";
      if (!this.eths[networkId]) throw Error("no eth for networkId");
      return await this.eths[networkId].getTransactionReceipt(address)
    }

    async sendRawTransaction(networkId, rawTx){
      if (!networkId) throw Error("no networkId");
      if (!rawTx) throw "no rawTx";
      if (!this.eths[networkId]) throw Error("no eth for networkId");
      return await this.eths[networkId].sendRawTransaction(rawTx);
    }

    //Search for an available address
    async getAvailableAddress(networkId,minBalance){
      if (!networkId) throw "no networkId";
      if (!minBalance) minBalance=0;
      
      console.log("getAvailableAddress: networkId: "+networkId+" minBalance: "+minBalance)
        
      for(let i=1;i<this.addresses.length;i++){
        const addr=this.addresses[i];
        console.log("getAvailableAddress: checking addr "+addr)
  
        //Call lockAccount and getBalance in parallel. Wait for both to complete
        let promisesRes = await Promise.all([
          this.lockAccount(networkId,addr),
          this.getBalance(networkId,addr)
        ]);
  
        let canLock=promisesRes[0];
        if(canLock){
          console.log("getAvailableAddress:    addr "+addr+" LOCKED !")
          const bal=promisesRes[1]; 
          console.log("getAvailableAddress:     bal "+addr+": "+bal)
          if(bal>=minBalance){
            return addr;
          }else{
            console.log("getAvailableAddress:    addr "+addr+" unlocking (not enough balance)")
            await this.updateAccount(networkId,addr,null)
          }
        }
      }
      //No address available :(
      return null;
    }

    async lockAccount(networkId, address) {
      if (!networkId) throw "no networkId";
      if (!address) throw "no address";
      if (!this.pgUrl) throw Error("no pgUrl set");
  
      const client = new Client({
        connectionString: this.pgUrl
      });
  
      try {
        await client.connect();
        const res = await client.query(
          "INSERT INTO accounts(address,network,status) \
               VALUES ($1,$2,'locked') \
          ON CONFLICT (address,network) DO UPDATE \
                SET status = 'locked' \
              WHERE accounts.address=$1 \
                AND accounts.network=$2 \
                AND accounts.status is NULL \
          RETURNING accounts.address;",
          [address, networkId]
        );
        return (res.rows.length == 1)
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }
    }
  
    async updateAccount(networkId,address,status){
      if (!networkId) throw "no networkId";
      if (!address) throw "no address";
      if (!this.pgUrl) throw Error("no pgUrl set");
  
      const client = new Client({
        connectionString: this.pgUrl
      });
  
      try {
        await client.connect();
        const res = await client.query(
          "UPDATE accounts\
                SET status = $3 \
              WHERE accounts.address=$1 \
                AND accounts.network=$2 \
          RETURNING accounts.address;",
          [address, networkId, status]
        );
        return res.rows[0]
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }
    }


    async statusAccount(networkId,address){
      if (!networkId) throw "no networkId";
      if (!address) throw "no address";
      if (!this.pgUrl) throw Error("no pgUrl set");

      const client = new Client({
        connectionString: this.pgUrl
      });

      try {
        await client.connect();
        const res = await client.query(
          "SELECT status \
              FROM accounts \
              WHERE accounts.address=$1 \
                AND accounts.network=$2;",
          [address, networkId]
        );
        return res.rows.length==0 ? null : res.rows[0].status
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }
    }

    async releaseCompleted(networkId){
      if (!networkId) throw "no networkId";

      let promises=[];
      for(let i=1;i<this.addresses.length;i++){
        const addr=this.addresses[i];
        console.log("checking addr: "+addr)

        //Checking status
        promises.push( new Promise( async (done) => {
          const status = await this.statusAccount(networkId,addr);
          console.log("["+addr+"] status:"+status);
          if(status!=null && status.startsWith('0x')){

            //Check if mined;
            const txReceipt=await this.getTransactionReceipt(networkId,status);
            //console.log(txReceipt);
            if(txReceipt!=null){
              console.log(txReceipt);
              console.log("["+addr+"]    ...releasing account")
              await this.updateAccount(networkId,addr,null);
              console.log("["+addr+"]    ...released!")
            }
          }
          done();
        }));


      } // /for 

      Promise.all(promises)
    }
 

    
}


