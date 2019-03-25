jest.mock('pg')
let { Client } = require('pg')

let pgClientMock={
    connect:jest.fn(),
    end:jest.fn()
}
Client.mockImplementation(()=>{return pgClientMock});

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
        expect(sut.pgUrl).toBeNull();
    });

    test("is isSecretsSet", () => {
        let secretSet = sut.isSecretsSet();
        expect(secretSet).toEqual(false);
    });

    test("storeFunding() no pgUrl set", done => {
        sut.storeFunding("t", "n","d").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("getPendingFunding() no pgUrl set", done => {
        sut.getPendingFunding("n").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("removeFunding() no pgUrl set", done => {
        sut.removeFunding("n","t").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("storeCallback() no pgUrl set", done => {
        sut.storeCallback("t", "n","c").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("getPendingCallbacks() no pgUrl set", done => {
        sut.getPendingCallbacks("n").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("removeCallback() no pgUrl set", done => {
        sut.removeCallback
        ("n","t").then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no pgUrl set");
            done();
          });
    });

    test("setSecrets", () => {
        expect(sut.isSecretsSet()).toEqual(false);
        sut.setSecrets({ PG_URL: "fakepsql" });
        expect(sut.isSecretsSet()).toEqual(true);
        expect(sut.pgUrl).not.toBeUndefined();
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


        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sut.fundTx("0x4",decodedTx,fundingInfo,"0xfunder")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "INSERT INTO fundings(tx_hash,network,decoded_tx) \
                 VALUES ($1,$2,$3)",
                [decodedTx.txHash,"0x4",decodedTx]
                );
                expect(pgClientMock.end).toBeCalled();
                done();
            })
            
        })
    });

    describe("storeFunding", () => {
        
        test('no txHash', (done)=> {
            sut.storeFunding()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no txHash')
                done()
            })
        })

        test('no networkId', (done)=> {
            sut.storeFunding("t")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('no decodedTx', (done)=> {
            sut.storeFunding("t","n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no decodedTx')
                done()
            })
        })

        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.storeFunding("t","n","d")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sut.storeFunding("t","n","d")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "INSERT INTO fundings(tx_hash,network,decoded_tx) \
                 VALUES ($1,$2,$3)",
                ["t","n","d"]
                );
                expect(pgClientMock.end).toBeCalled();
                done();
            })
            
        })

    });

    describe("getPendingFunding", () => {
        
        test('no networkId', (done)=> {
            sut.getPendingFunding()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.getPendingFunding("n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve({ rows: ["p"]});});
            sut.getPendingFunding("n")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "SELECT tx_hash,network,decoded_tx \
               FROM fundings \
              WHERE network=$1",
                ["n"]
                );
                expect(pgClientMock.end).toBeCalled();
                expect(resp).toEqual(["p"])
                done();
            })
            
        })

    });

    describe("removeFunding", () => {

        test('no networkId', (done)=> {
            sut.removeFunding()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })
        
        test('no txHash', (done)=> {
            sut.removeFunding("n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no txHash')
                done()
            })
        })


        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.removeFunding("n","t")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sut.removeFunding("n","t")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "DELETE FROM fundings \
              WHERE network=$1 \
                AND tx_hash=$2",
                ["n","t"]
                );
                expect(pgClientMock.end).toBeCalled();
                done();
            })
            
        })

    });

    describe("fundAddr()", () => {

        test('no networkId', (done)=> {
            sut.fundAddr()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('no receiver', (done)=> {
            sut.fundAddr("0x4")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no receiver')
                done()
            })
        })
        
        test('no amount', (done)=> {
            sut.fundAddr("0x4","0xreceiver")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no amount')
                done()
            })
        })

        test('no funder', (done)=> {
            sut.fundAddr("0x4","0xreceiver",1234)
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
            sut.fundAddr("0x4","0xreceiver",1234,"0xfunder")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('fund() fail')
                done()
            })
        })

        
        test('happy path without callback', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sensuiVaultMgrMock.fund.mockImplementationOnce( () => "0xfundTxHash")
            sut.fundAddr("0x4","0xreceiver",1234,"0xfunder")
            .then((resp)=> {
                expect(resp).toEqual("0xfundTxHash")
                done();
            })
            
        })


        test('happy path with callback', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sensuiVaultMgrMock.fund.mockImplementationOnce( () => "0xfundTxHash")
            const callbackUrl="https://callback"
            sut.fundAddr("0x4","0xreceiver",1234,"0xfunder",callbackUrl)
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "INSERT INTO callbacks(tx_hash,network,callback_url) \
                VALUES ($1,$2,$3)",
                ['0xfundTxHash',"0x4",callbackUrl]
                );
                expect(pgClientMock.end).toBeCalled();
                expect(resp).toEqual("0xfundTxHash")
                done();
            })
            
        })
    });

    describe("storeCallback", () => {
        
        test('no txHash', (done)=> {
            sut.storeCallback()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no txHash')
                done()
            })
        })

        test('no networkId', (done)=> {
            sut.storeCallback("t")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('no callbackUrl', (done)=> {
            sut.storeCallback("t","n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no callbackUrl')
                done()
            })
        })

        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.storeCallback("t","n","c")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sut.storeCallback("t","n","c")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "INSERT INTO callbacks(tx_hash,network,callback_url) \
                VALUES ($1,$2,$3)",
                ["t","n","c"]
                );
                expect(pgClientMock.end).toBeCalled();
                done();
            })
            
        })

    });

    describe("getPendingCallbacks", () => {
        
        test('no networkId', (done)=> {
            sut.getPendingCallbacks()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })

        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.getPendingCallbacks("n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve({ rows: ["p"]});});
            sut.getPendingCallbacks("n")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "SELECT tx_hash,network,callback_url \
             FROM callbacks \
            WHERE network=$1",
                ["n"]
                );
                expect(pgClientMock.end).toBeCalled();
                expect(resp).toEqual(["p"])
                done();
            })
            
        })

    });

    describe("removeCallback", () => {

        test('no networkId', (done)=> {
            sut.removeCallback()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no networkId')
                done()
            })
        })
        
        test('no txHash', (done)=> {
            sut.removeCallback("n")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no txHash')
                done()
            })
        })


        test('fail query', (done)=>{
            pgClientMock.query.mockImplementationOnce(  () => {throw new Error("query() fail")})
            sut.removeCallback("n","t")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('query() fail')
                done()
            })
            
        })

        test('happy path', (done)=>{
            pgClientMock.query = jest.fn(() => { return Promise.resolve();});
            sut.removeCallback("n","t")
            .then((resp)=> {
                expect(pgClientMock.connect).toBeCalled();
                expect(pgClientMock.query).toBeCalled();
                expect(pgClientMock.query).toBeCalledWith(
                "DELETE FROM callbacks \
            WHERE network=$1 \
              AND tx_hash=$2",
                ["n","t"]
                );
                expect(pgClientMock.end).toBeCalled();
                done();
            })
            
        })

    });
});
