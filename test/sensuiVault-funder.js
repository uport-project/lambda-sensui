const SensuiVault = artifacts.require("./SensuiVault.sol");

contract("SensuiVault funder functions", accounts => {

    beforeEach(async() => {
        instance = await SensuiVault.deployed();
        funder = accounts[3]
        
    });

    describe("deposit()", ()=>{
        it("0 value deposit", async() => {
            const funderContractBalance = await instance.balances(funder);
            await instance.deposit(funder,{from: funder, value: 0})
            assert.equal(funderContractBalance.toString(),(await instance.balances(funder)).toString())
        });

        it("100000 value self deposit", async() => {
            const funderContractBalance = await instance.balances(funder);
            await instance.deposit(funder,{from: funder, value: 100000})
            
            const newfunderContractBalance=funderContractBalance.toNumber()+100000
            
            assert.equal(newfunderContractBalance.toString(),(await instance.balances(funder)).toString())
        });
        
        it("100000 value other deposit", async() => {
            const funderContractBalance = await instance.balances(funder);
            await instance.deposit(funder,{from: accounts[4], value: 100000})
            
            const newfunderContractBalance=funderContractBalance.toNumber()+100000
            
            assert.equal(newfunderContractBalance.toString(),(await instance.balances(funder)).toString())
        });


    })
});