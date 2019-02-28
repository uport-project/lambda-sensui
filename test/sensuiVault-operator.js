const SensuiVault = artifacts.require("./SensuiVault.sol");

contract("SensuiVault operator functions", accounts => {

    beforeEach(async() => {
        instance = await SensuiVault.new();
        operator = accounts[2]
        await instance.addOperator(operator,{from: accounts[0]})
        funder = accounts[3]
        await instance.deposit(funder,{from: funder, value: 10000000})
        receiver = accounts[4]
    });

    describe("fund()", ()=>{
        it("non operator cannot fund", async() => {
            const funderContractBalance = await instance.balances(funder);
            const receiverBalance = await web3.eth.getBalance(receiver);
            const contractBalance = await web3.eth.getBalance(instance.address);
            try{
                await instance.fund(receiver,funder,1000000,{from: account[1]});
            }catch(err){
                assert.isNotNull(err);
            }
            assert.equal(funderContractBalance.toString(),(await instance.balances(funder)).toString())
            assert.equal(receiverBalance,await web3.eth.getBalance(receiver))
            assert.equal(contractBalance,await web3.eth.getBalance(instance.address))
        });
        
        it("cannot fund if not enough balance", async() => {
            const funderContractBalance = await instance.balances(funder);
            const receiverBalance = await web3.eth.getBalance(receiver);
            const contractBalance = await web3.eth.getBalance(instance.address);
            try{
                await instance.fund(receiver,funder,20000000,{from: operator});
            }catch(err){
                assert.isNotNull(err);
            }
            assert.equal(funderContractBalance.toString(),(await instance.balances(funder)).toString())
            assert.equal(receiverBalance,await web3.eth.getBalance(receiver))
            assert.equal(contractBalance,await web3.eth.getBalance(instance.address))
        });

        it("should fund", async() => {
            const funderContractBalance = await instance.balances(funder);
            const receiverBalance = await web3.eth.getBalance(receiver);
            const contractBalance = await web3.eth.getBalance(instance.address);
            const operatorBalance = await web3.eth.getBalance(operator);

            const amount=1000;
            const gasPrice=10;
            
            const tx=await instance.fund(receiver,funder,amount,{from: operator, gasPrice: gasPrice});

            //console.log("gasUsed: "+tx.receipt.gasUsed);

            const totalAmount = amount +  gasPrice*70000;
            const newfunderContractBalance=funderContractBalance.toNumber()-totalAmount
            const newreceiverBalance = Number(receiverBalance) + amount;
            const newcontractBalance = contractBalance - totalAmount;
            const newoperatorBalance = operatorBalance - tx.receipt.gasUsed*gasPrice + gasPrice*70000 ;

            //Check new Balances
            assert.equal(newfunderContractBalance.toString(),(await instance.balances(funder)).toString(),"funderContractBalance")
            assert.equal(newreceiverBalance,await web3.eth.getBalance(receiver),"receiverBalance")
            assert.equal(newcontractBalance,await web3.eth.getBalance(instance.address),"contractBalance")
            assert.equal(newoperatorBalance,await web3.eth.getBalance(operator),"operatorBalance")

            //Check log
            assert.equal("Funded",tx.logs[0].event)
            assert.equal(receiver,tx.logs[0].args.receiver)
            assert.equal(funder,tx.logs[0].args.funder)
            assert.equal(amount.toString(),tx.logs[0].args.amount.toString())

        });



    })
})