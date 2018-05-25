/*

file: relay.js
method: relay
needed parameters in url endpoint:
- metaSignedTx
- blockchain

activates relayhandler, which takes the following inputs (which are instatited
at the top of the file):
- authMgr
- ethereumMgr
- metaTxMgr

this activates the handle method in relay, which verifies the authorization authToken,
parses through the event body, ensures that the metatx parameter is inside the body and
see if its valid, check for blockchain parameter to see if its valid. Then it decodes
the metatransaction, verifies auth.sub and decodedMetaTx.claimedAddress, it signs the
raw transaction, and then it sends the raw, signed transaction
*/
class RelayHandler {
  constructor(authMgr, ethereumMgr, metaTxMgr) {
    this.authMgr = authMgr;
    this.ethereumMgr = ethereumMgr;
    this.metaTxMgr = metaTxMgr;
  }

  async handle(event, context, cb) {
    let authToken;
    try {
      authToken = await this.authMgr.verifyNisaba(event);
    } catch (err) {
      console.log("Error on this.authMgr.verifyNisaba");
      console.log(err);
      cb({ code: 401, message: err.message });
      return;
    }

    let body;

    if (event && !event.body) {
      body = event;
    } else if (event && event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        cb({ code: 400, message: "no json body" });
        return;
      }
    } else {
      cb({ code: 400, message: "no json body" });
      return;
    }

    if (!body.metaSignedTx) {
      cb({ code: 400, message: "metaSignedTx parameter missing" });
      return;
    }
    if (!body.blockchain) {
      cb({ code: 400, message: "blockchain parameter missing" });
      return;
    }

    // support hex strings starting with 0x
    if (body.metaSignedTx.startsWith("0x")) {
      body.metaSignedTx = body.metaSignedTx.slice(2);
    }

    //Check if metaTx signature is valid
    if (!(await this.metaTxMgr.isMetaSignatureValid(body))) {
      cb({ code: 403, message: "MetaTx signature invalid" });
      return;
    }

    let decodedMetaTx;
    try {
      decodedMetaTx = await this.metaTxMgr.decodeMetaTx(body.metaSignedTx);
    } catch (err) {
      console.log("Error on this.metaTxMgr.decodedMetaTx");
      console.log(err);
      cb({ code: 403, message: err.message });
      return;
    }

    //Verify auth.sub and decodedMetaTx.claimedAddress
    if (authToken.sub !== decodedMetaTx.claimedAddress) {
      console.log("authToken.sub !== decodedMetaTx.claimedAddress");
      cb({
        code: 403,
        message:
          "Auth token mismatch. Does not match `claimedAddress` field in metatx"
      });
      return;
    }

    let signedRawTx;
    try {
      signedRawTx = await this.ethereumMgr.signTx({
        txHex: body.metaSignedTx,
        blockchain: body.blockchain
      });
    } catch (err) {
      console.log("Error on this.ethereumMgr.signTx");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    try {
      const txHash = await this.ethereumMgr.sendRawTransaction(
        signedRawTx,
        body.blockchain
      );
      cb(null, txHash);
    } catch (err) {
      console.log("Error on this.ethereumMgr.sendRawTransaction");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
  }
}
module.exports = RelayHandler;
