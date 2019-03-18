const sutMgr = require('../fundingMgr');

describe('FundingMgr', () => {
    
    let sut;
    //Mocked Mgrs
    let ethereumMgrMock={ 
        getBalance: jest.fn().mockImplementation(()=>{ 
            return "0";
        }),
        getGasPrice: jest.fn().mockImplementation(()=>{
            return 1000000000
        })
    };

    let sensuiVaultMgrMock={
        fund: jest.fn()
    }

    const txHex="0xf86d820144843b9aca0082520894b78777860637d56543da23312c7865024833f7d188016345785d8a0000802ba0e2539a5d9f056d7095bd19d6b77b850910eeafb71534ebd45159915fab202e91a007484420f3968697974413fc55d1142dc76285d30b1b9231ccb71ed1e720faae"
    const decodedTx={
        "from": "0x17da6a8b86578cec4525945a355e8384025fa5af", 
        "to": "0xb78777860637d56543da23312c7865024833f7d1",
        "data":"",
        "value": 100000000000000000,
        "txGasLimit": 21000, 
        "txGasPrice": 1000000000, 
        "txHash": "0xf699beb4d1436439e3c362c9f98ddd67a1cbe76b018bbe98c301677f17637724", 
        "raw": txHex
    }
    const fundingInfo={
        "amountToFund": 33075000000000, 
        "balance": "0", 
        "isAbusingGasPrice": false, 
        "isFundingNeeded": true, 
        "networkGasPrice": 1000000000, 
        "topUpTo": 33075000000000, 
        "txNeeded": 21000000000000, 
        "txNeededTolerance": 22050000000000
    }

    beforeAll(async () => {
        sut = new sutMgr(ethereumMgrMock,sensuiVaultMgrMock);
    });

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    describe("decodeTx()", () => {

        test('no txHex', (done)=> {
            sut.decodeTx()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no txHex')
                done()
            })
        })

        test('badtx', (done)=> {
            sut.decodeTx('badtx')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('invalid remainder')
                done()
            })
        })

        test('verifySignature fail', (done)=> {
            sut.decodeTx(txHex.slice(-1))
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('txObj.verifySigntature() fail')
                done()
            })
        })

        test('happy path', (done)=>{
            sut.decodeTx(txHex)
            .then((resp)=> {
                expect(resp).toEqual(decodedTx)
                done();
            })
            
        })
    });


    describe("fundingInfo()", () => {

        test('no networkId', (done)=> {
            sut.fundingInfo()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('no decodedTx', (done)=> {
            sut.fundingInfo("0x4")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no decodedTx')
                done()
            })
        })

        test('ethereumMgr.getBalance() fail', (done)=> {
            ethereumMgrMock.getBalance.mockImplementationOnce( () => {throw new Error("getBalance fail")})
            sut.fundingInfo("0x4",decodedTx)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('getBalance fail')
                done()
            })
        })

        test('ethereumMgr.getGasPrice() fail', (done)=> {
            ethereumMgrMock.getGasPrice.mockImplementationOnce( () => {throw new Error("getGasPrice fail")})
            sut.fundingInfo("0x4",decodedTx)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('getGasPrice fail')
                done()
            })
        })

        test('happy path', (done)=>{
            sut.fundingInfo("0x4",decodedTx)
            .then((resp)=> {
                expect(resp).toEqual(fundingInfo)
                done();
            })
            
        })
    });

    describe("fundTx()", () => {

        test('no networkId', (done)=> {
            sut.fundTx()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('no decodedTx', (done)=> {
            sut.fundTx("0x4")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no decodedTx')
                done()
            })
        })
        
        test('no fundingInfo', (done)=> {
            sut.fundTx("0x4",decodedTx)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no fundingInfo')
                done()
            })
        })

        test('no funder', (done)=> {
            sut.fundTx("0x4",decodedTx,fundingInfo)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no funder')
                done()
            })
        })

        test('sensuiVaultMgr.fund() fail', (done)=> {
            sensuiVaultMgrMock.fund.mockImplementationOnce( () => {throw new Error("fund() fail")})
            sut.fundTx("0x4",decodedTx,fundingInfo,"0xfunder")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('fund() fail')
                done()
            })
        })


        test.skip('happy path', (done)=>{
            sut.fundTx("0x4",decodedTx,fundingInfo,"0xfunder")
            .then((resp)=> {
                done();
            })
            
        })
    });

});
