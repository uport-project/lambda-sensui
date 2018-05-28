"use strict";
const AWS = require("aws-sdk");

const EthereumMgr = require("./lib/ethereumMgr");
const FixNoncesHandler = require("./handlers/fixNonces");

let ethereumMgr = new EthereumMgr();

let fixNonces = new FixNoncesHandler(ethereumMgr);

/*
method: fixNonces
needed parameters in url endpoint:

activates fixnonce, which takes the following inputs (which are instatited
at the top of the file):
- ethereumMgr
- fixNonces

Purpose: this activates the handle method in handlers/fixNonce.js, which checks network nonce
against db nonce
*/
module.exports.fixNonces = (event, context, callback) => {
  preHandler(fixNonces, event, context, callback);
};

const preHandler = (handler, event, context, callback) => {
  console.log(event);
  if (!ethereumMgr.isSecretsSet()) {
    const kms = new AWS.KMS();
    kms
      .decrypt({
        CiphertextBlob: Buffer(process.env.SECRETS, "base64")
      })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext);
        ethereumMgr.setSecrets(JSON.parse(decrypted));
        handler.handle(event, context, callback);
      });
  } else {
    handler.handle(event, context, callback);
  }
};
