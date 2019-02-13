"use strict";
const createJsendHandler = require("./lib/jsend");
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const AuthMgr = require("./lib/authMgr");
const EthereumMgr = require("./lib/ethereumMgr");
const TxMgr = require("./lib/txMgr");
const MetaTxMgr = require("./lib/metaTxMgr");

//Instanciate Mgr
let authMgr = new AuthMgr();
let ethereumMgr = new EthereumMgr();
let txMgr = new TxMgr(ethereumMgr);
let metaTxMgr = new MetaTxMgr(ethereumMgr);

//Mgr that needs secrets handling
const secretsMgrArr=[authMgr,ethereumMgr];

//Load handlers
const FundHandler = require("./handlers/fund");
const RelayHandler = require("./handlers/relay");
const CheckPendingHandler = require('./handlers/checkPending')

//Instanciate handlers
let fundHandler  = createJsendHandler(new FundHandler(authMgr, txMgr, ethereumMgr));
let relayHandler = createJsendHandler(new RelayHandler(authMgr, ethereumMgr, metaTxMgr));
let checkPendingHandler = createJsendHandler(new CheckPendingHandler(ethereumMgr));

//Exports for serverless
exports.fund   = createSecretsWrappedHandler(secretsMgrArr,fundHandler);
exports.relay  = createSecretsWrappedHandler(secretsMgrArr,relayHandler);
exports.checkPending   = createSecretsWrappedHandler(secretsMgrArr,checkPendingHandler);
