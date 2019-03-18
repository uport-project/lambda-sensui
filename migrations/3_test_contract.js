var TestContract = artifacts.require("TestContract");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(TestContract);
};