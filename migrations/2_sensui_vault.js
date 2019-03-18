var SensuiVault = artifacts.require("SensuiVault");

module.exports = function(deployer,network,accounts) {

  let sensuiVault;

  // deployment steps
  deployer.deploy(SensuiVault)
  .then((inst)=>{
    sensuiVault=inst;

    if(network == "development"){
      console.log("Setting dev environment");
      sensuiVault.addOperator('0x5175fc732a96944a219d8055b35fd487085637f9')
      .then(()=>{
        console.log("operator added");
        return sensuiVault.deposit('0x5254b8b855a96fc1b151fa49d709b82eaa32e5e2',{value: 1000000000000000000})
      })
      .then(()=>{
        console.log("funder funded");
      })
    }
    
  });
};