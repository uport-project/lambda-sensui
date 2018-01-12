'use strict'
const AWS = require('aws-sdk');

const AuthMgr = require('./lib/authMgr')
const TxMgr = require('./lib/txMgr')
const EthereumMgr = require('./lib/ethereumMgr')
const FundHandler = require('./api-v1/fund')

let authMgr = new AuthMgr()
let txMgr = new TxMgr()
let ethereumMgr = new EthereumMgr()
let fundHandler = new FundHandler(authMgr,txMgr,ethereumMgr)

module.exports.fund = (event, context, callback) => { preHandler(fundHandler,event,context,callback) }

const preHandler = (handler,event,context,callback) =>{
  console.log(event)
  if(!ethereumMgr.isSecretsSet()){
    const kms = new AWS.KMS();
    kms.decrypt({
      CiphertextBlob: Buffer(process.env.SECRETS, 'base64')
    }).promise().then(data => {
      const decrypted = String(data.Plaintext)
      ethereumMgr.setSecrets(JSON.parse(decrypted))
      doHandler(handler,event,context,callback)
    })
  }else{
    doHandler(handler,event,context,callback)
  }
}

const doHandler = (handler,event,context,callback) =>{
  handler.handle(event,context,(err,resp)=>{
    let response;
    if(err==null){
      response = {
          statusCode: 200,
          body: JSON.stringify({
            status: 'success',
            data: resp
          })
        }
    }else{
      //console.log(err);
      let code=500;
      if(err.code) code=err.code;
      let message=err;
      if(err.message) message=err.message;
      
      response = {
        statusCode: code,
        body: JSON.stringify({
          status: 'error',
          message: message
        })
      }
    }

    callback(null, response)
  })

}
