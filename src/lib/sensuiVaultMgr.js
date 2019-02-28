const sensuiVaultArtifact = require('../../build/contracts/SensuiVault.json');

module.exports = class SensuiVaultMgr {
    constructor(ethereumMgr) {
      this.sensuiVaults = {};
      this.ethereumMgr = ethereumMgr;
    }
  
    async getSensuiVault(networkId) {
        if (!networkId) throw "no networkId";
        
        if (!sensuiVaults[networkId]) {
          let abi = sensuiVaultArtifact.abi;
          let sensuiVaultAddr = sensuiVaultArtifact.networks[networkId].address;
          let SensuiVaultContract = await this.ethereumMgr.getContract(abi, networkId);
          sensuiVaults[networkName] = SensuiVaultContract.at(sensuiVaultAddr);
        }

        return sensuiVaults[networkId];
    }

    async getBalance(networkId,address) {
        if (!networkId) throw "no networkId";
        if (!address) throw "no address";

        const sensuiVault=this.getSensuiVault(networkId);
        
        return (await sensuiVault.balance(address)).toString();
    }

    async fund(networkId,receiver,funder,amount){
        if (!networkId) throw "no networkId";
        if (!receiver) throw "no receiver";
        if (!funder) throw "no receiver";
        if (!amount) throw "no amount";

        const sensuiVault=this.getSensuiVault(networkId);

        //Get an available address/worker
        const gasPrice =  await this.ethereumMgr.getGasPrice(networkId);
        const gas = 50000;
        const minBalance= gas * gasPrice * 1.1;
        const from = await this.ethereumMgr.getAvailableAddress(networkId,minBalance);
    
        if(from == null){
            throw new Error("no available addresses");
            //TODO: queue the transaction until an available address.
        }

        let txOptions = {
            from: from,
            gas: gas,
            gasPrice: gasPrice,
            nonce: await this.ethereumMgr.getTransactionCount(from, blockchain)
        };

        console.log("Tx Options");
        console.log(txOptions);
        
        const txHash = await sensuiVault.fund(receiver,funder,amount,txOptions);
        
    }

}