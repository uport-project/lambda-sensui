const Transaction = require ('ethereumjs-tx');

module.exports = class FundingMgr {
    constructor(ethereumMgr,sensuiVaultMgr) {
        this.ethereumMgr=ethereumMgr;
        this.sensuiVaultMgr=sensuiVaultMgr;
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

        //TOOD: Store fundingTxHash and decodedTx.txHash in db
    }
}