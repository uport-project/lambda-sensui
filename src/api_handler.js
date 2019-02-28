"use strict";
const createCorsHandler = require("./lib/cors");
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const AuthMgr = require("./lib/authMgr");
const EthereumMgr = require("./lib/ethereumMgr");
const SensuiVaultMgr = require("./lib/sensuiVaultMgr");

//Instanciate Mgr
let authMgr = new AuthMgr();
let ethereumMgr = new EthereumMgr();
let sensuiVaultMgr = new SensuiVaultMgr(ethereumMgr);

//Mgr that needs secrets handling
const secretsMgrArr=[ethereumMgr];

//Load handlers
const RpcHandler = require("./handlers/rpc");

//Instanciate handlers
let rpcHandler  = createCorsHandler(new RpcHandler(authMgr,ethereumMgr,sensuiVaultMgr));

//Exports for serverless
exports.rpc   = createSecretsWrappedHandler(secretsMgrArr,rpcHandler);
