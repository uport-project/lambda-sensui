/*
file - authMgr.js - checks for an authorized manager of the service given
the proper JWT and secret

resource - jsontokens - https://www.npmjs.com/package/jsontokens

resource description - node.js library for signing, decoding,
and verifying JSON Web Tokens (JWTs), JSON Web Token (JWT) is a means of
representing claims to be transferred between two parties. The claims in a
JWT are encoded as a JSON object that is digitally signed using JSON Web
Signature (JWS) and/or encrypted using JSON Web Encryption (JWE).
*/
import { decodeToken, TokenVerifier } from "jsontokens";

class AuthMgr {
  constructor() {
    this.nisabaPub = null;
  }

  isSecretsSet() {
    return this.nisabaPub !== null;
  }

  setSecrets(secrets) {
    this.nisabaPub = secrets.NISABA_PUBKEY;
  }

  async verifyNisaba(event) {
    if (!event.headers) throw "no headers";
    if (!event.headers["Authorization"]) throw "no Authorization Header";
    if (!this.nisabaPub) throw "nisabaPub not set";

    let authHead = event.headers["Authorization"];

    let parts = authHead.split(" ");
    if (parts.length !== 2) {
      throw "Format is Authorization: Bearer [token]";
    }
    let scheme = parts[0];
    if (scheme !== "Bearer") {
      throw "Format is Authorization: Bearer [token]";
    }

    let dtoken;
    try {
      dtoken = decodeToken(parts[1]);
    } catch (err) {
      console.log(err);
      throw "Invalid JWT token";
    }

    //Verify Signature
    try {
      let verified = new TokenVerifier("ES256k", this.nisabaPub).verify(
        parts[1]
      );
      if (!verified) throw "not verified";
    } catch (err) {
      console.log(err);
      throw "Invalid signature in JWT token";
    }

    // TODO verify: iat, exp, aud
    return dtoken.payload;
  }
}
module.exports = AuthMgr;
