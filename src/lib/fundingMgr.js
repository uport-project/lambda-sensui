const Transaction = require ('ethereumjs-tx');
const rp = require('request-promise-native');
const { Client } = require ("pg");

module.exports = class FundingMgr {
    constructor(ethereumMgr,sensuiVaultMgr) {
        this.ethereumMgr=ethereumMgr;
        this.sensuiVaultMgr=sensuiVaultMgr;

        this.pgUrl = null;
        
    }

    isSecretsSet() {
        return this.pgUrl !== null;
    }

    setSecrets(secrets) {
        this.pgUrl = secrets.PG_URL;
    }
  
    async decodeTx(txHex) {
        if (!txHex) throw Error("no txHex");

        //Decode tx
        let txObj
        try{
            txObj = new Transaction(txHex);
        } catch (error){
            console.log("new Transaction(txHex) error: "+error.message)
            throw error
        } 
        //console.log(txObj);

        //Verify Tx Signature
        try{
            if(!txObj.verifySignature()) throw Error("txObj.verifySigntature() fail")
        } catch (error){
            console.log("txObj.verifySignature() error: "+error.message)
            throw error
        } 

        let decodedTx={};
        decodedTx.from = '0x' + txObj.getSenderAddress().toString('hex')
        decodedTx.to = '0x'+txObj.to.toString('hex')
        decodedTx.data = txObj.data.toString('hex')
        decodedTx.value = parseInt(txObj.value.toString('hex'), 16)
        decodedTx.txGasPrice = parseInt(txObj.gasPrice.toString('hex'),16)
        decodedTx.txGasLimit = parseInt(txObj.gasLimit.toString('hex'),16)
        decodedTx.txHash = "0x"+txObj.hash().toString('hex')
        decodedTx.raw = txHex

        return decodedTx;       
    }

    async fundingInfo(networkId,decodedTx){
        if (!networkId) throw Error("no networkId");
        if (!decodedTx) throw Error("no decodedTx");

        //TODO: Make both calls in parallel (Promise.all)

        //Get balance of `from`
        let balance;
        try {
            balance = await this.ethereumMgr.getBalance(networkId,decodedTx.from);
        } catch (error){
            console.log("this.ethereumMgr.getBalance() error: "+error.message)
            throw error;
        } 
        
        //Get networkGasPrice
        let networkGasPrice;
        try {
            networkGasPrice = await this.ethereumMgr.getGasPrice(networkId);
        } catch (error){
            console.log("this.etherumMgr.getGasPrice() error: "+error.message)
            throw error;
        }
        
        let isAbusingGasPrice = ( decodedTx.txGasPrice > networkGasPrice * 50 ) // TODO: Change 50 to ENV_VAR. No magic numbers!
        
        const info={
            balance: balance,
            txNeeded: decodedTx.txGasPrice * decodedTx.txGasLimit,
            networkGasPrice: networkGasPrice,
            isAbusingGasPrice: isAbusingGasPrice
        }
        info.txNeededTolerance = info.txNeeded * 1.05; //TODO: Change 1.05 to ENV_VAR. No magic numbers!
        info.isFundingNeeded = (parseInt(info.balance) < info.txNeededTolerance);
        info.topUpTo = info.txNeededTolerance * 1.5,
        info.amountToFund = info.topUpTo - parseInt(info.balance)
        return info
    }

    async fundTx(networkId,decodedTx,fundingInfo,funder){
        if (!networkId) throw Error("no networkId");
        if (!decodedTx) throw Error("no decodedTx");
        if (!fundingInfo) throw Error("no fundingInfo");
        if (!funder) throw Error("no funder");

        //TODO: Check if funder have enough balance on the sensuiVault to do 
        // the funding

        let fundingTxHash;
        try {
            fundingTxHash=await this.sensuiVaultMgr.fund(
                networkId,
                decodedTx.from,
                funder,
                fundingInfo.amountToFund);
        } catch (error){
            console.log("this.sensuiVaultMgr.fund error: "+error.message)
            throw error;
        }

        console.log(fundingTxHash);

        //Store decodedTx.txHash in db
        await this.storeFunding(decodedTx.txHash,networkId,decodedTx);
    }

    async storeFunding(txHash,networkId,decodedTx){
        if (!txHash) throw Error("no txHash");
        if (!networkId) throw Error("no networkId");
        if (!decodedTx) throw Error("no decodedTx");
        if (!this.pgUrl) throw Error("no pgUrl set");
    
        const client = new Client({
          connectionString: this.pgUrl
        });
    
        try {
          await client.connect();
          const res = await client.query(
            "INSERT INTO fundings(tx_hash,network,decoded_tx) \
                 VALUES ($1,$2,$3)",
            [txHash, networkId,decodedTx]
          );
        } catch (e) {
          throw e;
        } finally {
          await client.end();
        }
    }

    async getPendingFunding(networkId){
        if (!networkId) throw Error("no networkId");
        if (!this.pgUrl) throw Error("no pgUrl set");
    
        const client = new Client({
          connectionString: this.pgUrl
        });
    
        try {
          await client.connect();
          const res = await client.query(
            "SELECT tx_hash,network,decoded_tx \
               FROM fundings \
              WHERE network=$1",
            [networkId]
          );
          return res.rows;
        } catch (e) {
          throw e;
        } finally {
          await client.end();
        }
    }

    async removeFunding(networkId,txHash){
        if (!networkId) throw Error("no networkId");
        if (!txHash) throw Error("no txHash");
        if (!this.pgUrl) throw Error("no pgUrl set");
    
        const client = new Client({
          connectionString: this.pgUrl
        });
    
        try {
          await client.connect();
          const res = await client.query(
            "DELETE FROM fundings \
              WHERE network=$1 \
                AND tx_hash=$2",
            [networkId,txHash]
          );
        } catch (e) {
          throw e;
        } finally {
          await client.end();
        }

    }

    async retry(networkId){
        if (!networkId) throw "no networkId";

        const pending=await this.getPendingFunding(networkId);
  
        let promises=[];

        for(let i=0;i<pending.length;i++){
          const pend=pending[i];
          console.log("["+networkId+":"+pend.tx_hash+"] checking... ");

          //Checking pending tx
          promises.push( new Promise( async (done) => {

            //Check if tx is mined already
            const txReceipt=await this.ethereumMgr.getTransactionReceipt(networkId,pend.tx_hash);
            //console.log(txReceipt);
            if(txReceipt!=null){
              console.log("["+networkId+":"+pend.tx_hash+"] txReceipt: "+JSON.stringify(txReceipt));
              console.log("["+networkId+":"+pend.tx_hash+"] ...removing funding tx")
              await this.removeFunding(networkId,pend.tx_hash);
              console.log("["+networkId+":"+pend.tx_hash+"] ...removed!")

            }else{
              //Checking if funding is still needed
              const fundingInfo=await this.fundingInfo(networkId,pend.decoded_tx)
              if(!fundingInfo.isFundingNeeded){
                  //Relay to networkEndpoint
                  console.log("["+networkId+":"+pend.tx_hash+"] No funding needed. Relaying... ");
                  await this.ethereumMgr.sendRawTransaction(networkId,pend.decoded_tx.raw);
                  console.log("["+networkId+":"+pend.tx_hash+"] Relayed! ");
              }
            }
            done();
          }));
  
  
        } // /for 
  
        Promise.all(promises)
      }
      

    async fundAddr(networkId,receiver,amount,funder,callback){
      if (!networkId) throw Error("no networkId");
      if (!receiver) throw Error("no receiver");
      if (!amount) throw Error("no amount");
      if (!funder) throw Error("no funder");

      //TODO: Check if funder have enough balance on the sensuiVault to do 
      // the funding

      let fundingTxHash;
      try {
          fundingTxHash=await this.sensuiVaultMgr.fund(
              networkId,
              receiver,
              funder,
              amount);
      } catch (error){
          console.log("this.sensuiVaultMgr.fund error: "+error.message)
          throw error;
      }

        if(callback){
          await this.storeCallback(fundingTxHash,networkId,callback);
        }

        return fundingTxHash;
        
    }


    async storeCallback(txHash,networkId,callbackUrl){
      if (!txHash) throw Error("no txHash");
      if (!networkId) throw Error("no networkId");
      if (!callbackUrl) throw Error("no callbackUrl");
      if (!this.pgUrl) throw Error("no pgUrl set");
  
      const client = new Client({
        connectionString: this.pgUrl
      });
  
      try {
        await client.connect();
        const res = await client.query(
          "INSERT INTO callbacks(tx_hash,network,callback_url) \
                VALUES ($1,$2,$3)",
          [txHash, networkId,callbackUrl]
        );
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }
    }

    async getPendingCallbacks(networkId){
      if (!networkId) throw Error("no networkId");
      if (!this.pgUrl) throw Error("no pgUrl set");
  
      const client = new Client({
        connectionString: this.pgUrl
      });
  
      try {
        await client.connect();
        const res = await client.query(
          "SELECT tx_hash,network,callback_url \
             FROM callbacks \
            WHERE network=$1",
          [networkId]
        );
        return res.rows;
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }
  }

  async removeCallback(networkId,txHash){
      if (!networkId) throw Error("no networkId");
      if (!txHash) throw Error("no txHash");
      if (!this.pgUrl) throw Error("no pgUrl set");
  
      const client = new Client({
        connectionString: this.pgUrl
      });
  
      try {
        await client.connect();
        const res = await client.query(
          "DELETE FROM callbacks \
            WHERE network=$1 \
              AND tx_hash=$2",
          [networkId,txHash]
        );
      } catch (e) {
        throw e;
      } finally {
        await client.end();
      }

  }


    async doCallbacks(networkId){
      if (!networkId) throw "no networkId";

      const pending=await this.getPendingCallbacks(networkId);

      let promises=[];

      for(let i=0;i<pending.length;i++){
        const pend=pending[i];
        console.log("["+networkId+":"+pend.tx_hash+"] checking... ");

        //Checking pending tx
        promises.push( new Promise( async (done) => {

          //Check if tx is mined already
          const txReceipt=await this.ethereumMgr.getTransactionReceipt(networkId,pend.tx_hash);
          //console.log(txReceipt);
          if(txReceipt!=null){
            console.log("["+networkId+":"+pend.tx_hash+"] txReceipt: "+JSON.stringify(txReceipt));
            console.log("["+networkId+":"+pend.tx_hash+"] ... callbacking...")
            //Callback
            const options = {
                method: 'GET',
                uri: pend.callback_url,
            };
          
            try{
              const callbackResp = await rp(options);
              console.log(callbackResp);
            }catch(err){
              console.log(err.message)
            }
            console.log("["+networkId+":"+pend.tx_hash+"] ... callbacked!")

            console.log("["+networkId+":"+pend.tx_hash+"] ... removing callback")
            await this.removeCallback(networkId,pend.tx_hash);
            console.log("["+networkId+":"+pend.tx_hash+"] ... removed!")

          }
          done();
        }));


      } // /for 

      Promise.all(promises)
    }
}