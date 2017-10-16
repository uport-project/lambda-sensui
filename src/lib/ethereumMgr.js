
class EthereumMgr {
    
    constructor(pgUrl) {
        this.pgUrl=pgUrl;
        //TODO: Any code initialization here
    }

    //Todo: Define functions
    getBalance(pnt){
        return new Promise( (resolve,reject) => {
            reject('not implemented')
        }); 
    }
}    

module.exports = EthereumMgr;