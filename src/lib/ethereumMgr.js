import { TxRelay } from 'uport-identity'


class EthereumMgr {

  constructor(pgUrl) {
    this.pgUrl=pgUrl;
    //TODO: Any code initialization here
  }

  //Todo: Define functions
  getBalance(pnt, networkName){
    return new Promise( (resolve,reject) => {
      reject('not implemented')
    });
  }

  async getNonce(networkName) {
  }

  async sendRawTransaction(signedRawTx, networkName) {
  }

  async getRelayNonceForAddress(address, networkName) {
  }

  getRelayAddress(networkName) {
    return TxRelay.networks[networkNameToId(networkName)].address
  }

  networkNameToId(networkName) {
  }

}

module.exports = EthereumMgr;
