const sutHandler = require('../fund');

describe('FundHandler', () => {
    
    let sut;
    const authToken="faketoken";


    //Mocked Mgrs
    let authMgrMock={ verify: jest.fn().mockImplementation(()=>{ 
        return {
            issuer:'did:ethr:someIssuer', 
            payload: {
                sub:'0x17da6a8b86578cec4525945a355e8384025fa5af'
            }
        }
    })};

    let fundingMgrMock = {
        decodeTx: jest.fn().mockImplementation(()=>{ 
            return {
                "from": "0x17da6a8b86578cec4525945a355e8384025fa5af", 
                "to": "0xb78777860637d56543da23312c7865024833f7d1",
                "data":"",
                "value": 100000000000000000,
                "txGasLimit": 21000, 
                "txGasPrice": 1000000000, 
                "txHash": "0xf699beb4d1436439e3c362c9f98ddd67a1cbe76b018bbe98c301677f17637724", 
            }}),
        fundingInfo: jest.fn().mockImplementation(()=>{
            return {
                "amountToFund": 33075000000000, 
                "balance": "0", 
                "isAbusingGasPrice": false, 
                "isFundingNeeded": true, 
                "networkGasPrice": 1000000000, 
                "topUpTo": 33075000000000, 
                "txNeeded": 21000000000000, 
                "txNeededTolerance": 22050000000000
            }}),
        fundAddr: jest.fn()
        };

    beforeAll(async () => {
        sut = new sutHandler(authMgrMock,fundingMgrMock);
    });

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    test('handle no networkId', done => {
        const event = {}
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(400)
            expect(err.message).toEqual('no networkId')
            done();
        })
    });

    test('handle undefined networkId', done => {
        const event = {
            pathParameters:{ networkId:'0'}
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(400)
            expect(err.message).toEqual('undefined networkId')
            done();
        })
    });

    test('handle no authToken', done => {
        const event = {
            pathParameters:{networkId:'4'}
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(401)
            expect(err.message).toEqual('no authToken')
            done();
        })
    });

    test('handle no body', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
        }
        sut.handle(event,null,(err,res)=>{
          expect(err).not.toBeNull()
          expect(err.code).toEqual(403)
          expect(err.message.substring(0,14)).toEqual('no json body: ')
          done()
        })
      })
  
    test('handle no json body', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: "badJson"
        }
        sut.handle(event,null,(err,res)=>{
          expect(err).not.toBeNull()
          expect(err.code).toEqual(403)
          expect(err.message.substring(0,14)).toEqual('no json body: ')
          done()
        })
      })
  
      test('handle no receiver', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: '{"amount": 1234}'
        }
        sut.handle(event,null,(err,res)=>{
          expect(err).not.toBeNull()
          expect(err.code).toEqual(403)
          expect(err.message).toEqual('receiver parameter missing')
          done()
        })
      })

      test('handle no amount', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: '{"receiver": "0xreceiver"}'
        }
        sut.handle(event,null,(err,res)=>{
          expect(err).not.toBeNull()
          expect(err.code).toEqual(403)
          expect(err.message).toEqual('amount parameter missing')
          done()
        })
      })
  

    
    test('handle authMgr.verify fail', done => {
        authMgrMock.verify.mockImplementationOnce( () => {throw new Error("bad verify")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: '{"receiver":"0xreceiver","amount":1234}'
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(401)
            expect(err.message).toEqual('bad verify')
            done();
        })
    });

    
    
    test('handle fundingMgr.fundAddr fail', done => {
        fundingMgrMock.fundAddr.mockImplementationOnce( () => {throw new Error("fundAddr fail")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: '{"receiver":"0xreceiver","amount":1234}'
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err).toEqual('fundAddr fail')
            done();
        })
    });

    test('handle happy path', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: '{"receiver":"0xreceiver","amount":1234}' 
        }
        fundingMgrMock.fundAddr.mockImplementationOnce( () => "0xfundTxHash")
        
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res).toEqual("0xfundTxHash")
            done();
        })
    });


})

