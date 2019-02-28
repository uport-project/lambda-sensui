var SensuiVault = artifacts.require("SensuiVault");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(SensuiVault);
};