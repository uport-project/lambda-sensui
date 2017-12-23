'use strict'

const RelayHandler = require('./api-v2/relay')
const EthereumMgr = require('./lib/ethereumMgr')

let ethereumMgr = new EthereumMgr(process.env.PG_URL)
let relayHandler = new RelayHandler(ethereumMgr, process.env.SEED)

module.exports.relay = (event, context, callback) => {
  doHandler(relayHandler, event, context, callback)
}

const doHandler = (handler, event, context, callback) => {
  console.log(event)
  handler.handle(event, context, (err, resp) => {
    let response;
    if (err == null) {
      response = {
        statusCode: 200,
        body:JSON.stringify({
          status: 'success',
          data: resp
        })
      }
    } else {
      console.log("ERROR: ", err.message);
      let code = 500;
      if (err.code) code = err.code;
      let message = err;
      if (err.message) message = err.message;

      let body =
      response = {
        statusCode: code,
        body: JSON.stringify({
          status: 'error',
          message
        })
      }
    }
    callback(null, response)
  })

}

module.exports.endPool = ethereumMgr.closePool.bind(ethereumMgr)
