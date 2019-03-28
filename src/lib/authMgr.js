const didJWT = require('did-jwt')


module.exports = class AuthMgr {

    constructor() {
        require('ethr-did-resolver').default()
    }

    async verify(authToken) {
        if (!authToken) throw new Error('no authToken')
        const verifiedToken = await didJWT.verifyJWT(authToken);
        return verifiedToken;
   }

    
}


