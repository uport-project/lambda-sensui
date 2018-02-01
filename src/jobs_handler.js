'use strict'
const AWS = require('aws-sdk');

const EthereumMgr = require('./lib/ethereumMgr')
const SlackMgr = require('./lib/slackMgr')
const CheckBalancesHandler = require('./handlers/checkBalances')

let ethereumMgr = new EthereumMgr()
let slackMgr = new SlackMgr()

let checkBalances = new CheckBalancesHandler(ethereumMgr,slackMgr)

module.exports.checkBalances = (event, context, callback) => { preHandler(checkBalances,event,context,callback) }

const preHandler = (handler,event,context,callback) =>{
  console.log(event)
  if(!ethereumMgr.isSecretsSet() ||
     !slackMgr.isSecretsSet()) {
    const kms = new AWS.KMS();
    kms.decrypt({
      CiphertextBlob: Buffer(process.env.SECRETS, 'base64')
    }).promise().then(data => {
      const decrypted = String(data.Plaintext)
      ethereumMgr.setSecrets(JSON.parse(decrypted))
      slackMgr.setSecrets(JSON.parse(decrypted))
      handler.handle(event,context,callback)
    })
  }else{
    handler.handle(event,context,callback)
  }
}
