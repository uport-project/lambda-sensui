const { generators, signers } = require("eth-signer");
const HDSigner = signers.HDSigner;
const Transaction = require ('ethereumjs-tx');
const networks = require('../lib/networks');
const SignerProvider = require("ethjs-provider-signer");
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');

const MIN_GAS_PRICE = 1000000000; // 1 Gwei

module.exports = class EthereumMgr {

    constructor() {
        this.pgUrl = null;
        this.seed = null;
    
        this.eths = {};
        this.gasPrices = {};
      }
    
      isSecretsSet() {
        return this.pgUrl !== null || this.seed !== null;
      }
    
      setSecrets(secrets) {
        this.pgUrl = secrets.PG_URL;
        this.seed = secrets.SEED;
        
        this.signers={};
        this.addresses=[];
    
        //Init root+20 accounts
        const maxAccounts=20;
        const hdPrivKey = generators.Phrase.toHDPrivateKey(this.seed);
    
         for(let i=0;i<=maxAccounts;i++){
          const signer = new HDSigner(hdPrivKey,i);
          const addr = signer.getAddress();
          this.signers[addr]=signer;
          this.addresses[i]=addr;
        }

        const txSigner = {
          signTransaction: (tx_params, cb) => {
            let tx = new Transaction(tx_params);
            let rawTx = tx.serialize().toString("hex");
            this.signers[tx_params.from].signRawTx(rawTx, (err, signedRawTx) => {
              cb(err, "0x" + signedRawTx);
            });
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
    
}


