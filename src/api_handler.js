"use strict";
const createCorsHandler = require("./lib/cors");
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const AuthMgr = require("./lib/authMgr");

//Instanciate Mgr
let authMgr = new AuthMgr();

//Mgr that needs secrets handling
const secretsMgrArr=[];

//Load handlers
const RpcHandler = require("./handlers/rpc");

//Instanciate handlers
let rpcHandler  = createCorsHandler(new RpcHandler(authMgr));

//Exports for serverless
exports.rpc   = createSecretsWrappedHandler(secretsMgrArr,rpcHandler);
