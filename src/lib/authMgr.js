import { decodeToken, TokenVerifier } from 'jsontokens'
import { verifyJWT } from 'did-jwt'

class AuthMgr {

    constructor() {
        this.nisabaPub=null
        this.allowedIss=null
    }
    
    isSecretsSet(){
        return (this.nisabaPub !== null && this.allowedIss !== null);
    }
    
    setSecrets(secrets){
        this.nisabaPub=secrets.NISABA_PUBKEY;
        this.allowedIss=(secrets.ALLOWED_ISS)?secrets.ALLOWED_ISS.split(','):[];
    }

    async verifyFuelToken(event){
        if(!event.headers) throw Error('no headers')
        if(!event.headers['Authorization']) throw Error('no Authorization Header')  

        let authHead=event.headers['Authorization']

        let parts = authHead.split(' ')
        if (parts.length !== 2) {
            throw Error('Format is Authorization: Bearer [token]')
        }
        let scheme = parts[0];
        if (scheme !== 'Bearer') {
            throw Error('Format is Authorization: Bearer [token]')
        }

        const token=parts[1];
        let dtoken
        try {
            dtoken = decodeToken(token)
        } catch (err) {
            console.log(err)
            throw Error('Invalid JWT token')
        }

        //Choose how to verify.
        if (dtoken.payload.iss.startsWith("did:")){
            const decodedDid = await this.verifyDid(token)
            if(!await this.isIssAllowed(decodedDid.payload.iss)) throw Error('iss not allowed')
            return decodedDid.payload;
        } else {
            await this.verifyNisaba(token);
            return dtoken.payload;
        }

    }
    
    async verifyNisaba(token){
        if(!this.nisabaPub) throw Error('nisabaPub not set')   
        //Verify Signature
        try{
            let verified = new TokenVerifier('ES256k', this.nisabaPub).verify(token)
            if(!verified) throw Error('not verified')
        } catch (err) {
            console.log(err)
            throw Error('Invalid signature in JWT token')
        }
    }

    async verifyDid(token){
        require('ethr-did-resolver')()
        return await verifyJWT(token)
    }

    async isIssAllowed(iss){
        if(!this.allowedIss) throw Error('allowedIss not set')   
        return this.allowedIss.includes(iss)
    }
}
module.exports = AuthMgr
