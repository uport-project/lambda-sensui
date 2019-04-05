"use strict";
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const FundingMgr = require("./lib/fundingMgr");
const EthereumMgr = require("./lib/ethereumMgr");
const SensuiVaultMgr = require("./lib/sensuiVaultMgr");

//Instanciate Mgr
let ethereumMgr = new EthereumMgr();
let sensuiVaultMgr = new SensuiVaultMgr(ethereumMgr);
let fundingMgr = new FundingMgr(ethereumMgr,sensuiVaultMgr);

//Mgr that needs secrets handling
const secretsMgrArr=[ethereumMgr,fundingMgr];

//Load handlers
const CheckPendingsHandler = require("./handlers/check_pendings");

//Instanciate handlers
let checkPendingsHandler  = new CheckPendingsHandler(ethereumMgr,fundingMgr)

//Exports for serverless
exports.check_pendings   = createSecretsWrappedHandler(secretsMgrArr,(e,c,v)=>{checkPendingsHandler.handle(e,c,v)});
