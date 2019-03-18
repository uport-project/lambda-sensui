"use strict";
const createCorsHandler = require("./lib/cors");
const createJsendHandler = require("./lib/jsend");
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const AuthMgr = require("./lib/authMgr");
const FundingMgr = require("./lib/fundingMgr");
const EthereumMgr = require("./lib/ethereumMgr");
const SensuiVaultMgr = require("./lib/sensuiVaultMgr");

//Instanciate Mgr
let authMgr = new AuthMgr();
let ethereumMgr = new EthereumMgr();
let sensuiVaultMgr = new SensuiVaultMgr(ethereumMgr);
let fundingMgr = new FundingMgr(ethereumMgr,sensuiVaultMgr);

//Mgr that needs secrets handling
const secretsMgrArr=[ethereumMgr,fundingMgr];

//Load handlers
const NewBlockHandler = require("./handlers/new_block");
const RpcHandler = require("./handlers/rpc");

//Instanciate handlers
let rpcHandler  = createCorsHandler(new RpcHandler(authMgr,fundingMgr,ethereumMgr,sensuiVaultMgr));
let newBlockHandler  = createJsendHandler(new NewBlockHandler(ethereumMgr,fundingMgr));

//Exports for serverless
exports.rpc   = createSecretsWrappedHandler(secretsMgrArr,rpcHandler);
exports.new_block   = createSecretsWrappedHandler(secretsMgrArr,newBlockHandler);
