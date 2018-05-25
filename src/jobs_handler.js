"use strict";
const AWS = require("aws-sdk");

const EthereumMgr = require("./lib/ethereumMgr");
const SlackMgr = require("./lib/slackMgr");
const CheckBalancesHandler = require("./handlers/checkBalances");

let ethereumMgr = new EthereumMgr();
let slackMgr = new SlackMgr();

let checkBalances = new CheckBalancesHandler(ethereumMgr, slackMgr);

/*
method: checkBalances
needed parameters in url endpoint:
- context in body

activates checkbalance, which takes the following inputs (which are instatited
at the top of the file):
- ethereumMgr
- slackMgr

Purpose: this activates the handle method in handlers/checkBalances.js, which checks
body context for address, stage, and blockchain entwork and sends back balance of address
*/
module.exports.checkBalances = (event, context, callback) => {
  preHandler(checkBalances, event, context, callback);
};

const preHandler = (handler, event, context, callback) => {
  console.log(event);
  if (!ethereumMgr.isSecretsSet() || !slackMgr.isSecretsSet()) {
    const kms = new AWS.KMS();
    kms
      .decrypt({
        CiphertextBlob: Buffer(process.env.SECRETS, "base64")
      })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext);
        ethereumMgr.setSecrets(JSON.parse(decrypted));
        slackMgr.setSecrets(JSON.parse(decrypted));
        handler.handle(event, context, callback);
      });
  } else {
    handler.handle(event, context, callback);
  }
};
