"use strict";
const AWS = require("aws-sdk");

const EthereumMgr = require("./lib/ethereumMgr");
const FixNoncesHandler = require("./handlers/fixNonces");

let ethereumMgr = new EthereumMgr();

let fixNonces = new FixNoncesHandler(ethereumMgr);

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
