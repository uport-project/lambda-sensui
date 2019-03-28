const SensuiVault = artifacts.require("./SensuiVault.sol");

contract("SensuiVault owner functions", accounts => {

    beforeEach(async() => {
        instance = await SensuiVault.deployed();
    });

    describe("contructor()", ()=>{
        it("owner is deployer", async() => {
            assert.equal(await instance.owner(), accounts[0]);
        });
        
        it("fee is 0", async() => {
            assert.equal(await instance.sensuiFee(), 0);
        });
        
    })

    describe("changeOwner()", ()=> {
        it("non-owner cannot change owner", async() =>{
            assert.equal(await instance.owner(), accounts[0]);
            try{
                await instance.changeOwner(accounts[1],{from: accounts[1]})
            }catch(err){
                assert.isNotNull(err);
            }
            assert.equal(await instance.owner(), accounts[0]);
        })

        it("owner can change owner", async() =>{
            assert.equal(await instance.owner(), accounts[0]);
            await instance.changeOwner(accounts[1],{from: accounts[0]})
            assert.equal(await instance.owner(), accounts[1]);
            await instance.changeOwner(accounts[0],{from: accounts[1]})
            assert.equal(await instance.owner(), accounts[0]);
        })

    })

    describe("addOperator()", ()=> {
        it("non-owner cannot add operator", async() =>{
            assert.isFalse(await instance.operators(accounts[2]));
            try{
                await instance.addOperator(accounts[2],{from: accounts[1]})
            }catch(err){
                assert.isNotNull(err);
            }
            assert.isFalse(await instance.operators(accounts[2]));
        })

        it("owner can change add operator", async() =>{
            assert.isFalse(await instance.operators(accounts[2]));
            await instance.addOperator(accounts[2],{from: accounts[0]})
            assert.isTrue(await instance.operators(accounts[2]));
        })

    })

    describe("removeOperator()", ()=> {
        it("non-owner cannot remove operator", async() =>{
            assert.isTrue(await instance.operators(accounts[2]));
            try{
                await instance.removeOperator(accounts[2],{from: accounts[1]})
            }catch(err){
                assert.isNotNull(err);
            }
            assert.isTrue(await instance.operators(accounts[2]));
        })

        it("owner can change remove operator", async() =>{
            assert.isTrue(await instance.operators(accounts[2]));
            await instance.removeOperator(accounts[2],{from: accounts[0]})
            assert.isFalse(await instance.operators(accounts[2]));
        })

    })

    describe("setSensuiFee()", ()=> {
        it("non-owner cannot set fee", async() =>{
            assert.equal(await instance.sensuiFee(),0);
            try{
                await instance.setSensuiFee(10,{from: accounts[1]})
            }catch(err){
                assert.isNotNull(err);
            }
            assert.equal(await instance.sensuiFee(),0);
        })

        it("owner can change set fee", async() =>{
            assert.equal(await instance.sensuiFee(),0);
            await instance.setSensuiFee(10,{from: accounts[0]})
            assert.equal(await instance.sensuiFee(),10);
        })

    })


});