jest.mock('request-promise-native');
const rpn = require('request-promise-native');

const sutHandler = require('../rpc');

describe('RpcHandler', () => {
    
    let sut;
    const authToken="faketoken";
    const rawTx="0xf86d820144843b9aca0082520894b78777860637d56543da23312c7865024833f7d188016345785d8a0000802ba0e2539a5d9f056d7095bd19d6b77b850910eeafb71534ebd45159915fab202e91a007484420f3968697974413fc55d1142dc76285d30b1b9231ccb71ed1e720faae"


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
        fundTx: jest.fn()
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
            pathParameters:{ networkId:'0x0'}
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

    test('handle no jsonRpc', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken }
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            done();
        })
    });

    test('failed relayed call', done => {
        rpn.mockImplementationOnce( (opt) => { throw Error('fail')} );
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"net_version","params":[],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32000)
            expect(err.error.message).toEqual('fail')
            done();
        })
    });

    test('happy path relayed call', done => {
        rpn.mockImplementationOnce( () => { return  {"id": 67, "jsonrpc": "2.0", "result": "4"}} );
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"net_version","params":[],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res).toEqual( {"id": 67, "jsonrpc": "2.0", "result": "4"})
            done();
        })
    });

    test('handle authMgr.verify fail', done => {
        authMgrMock.verify.mockImplementationOnce( () => {throw new Error("bad verify")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32001)

            expect(err.error.message).toEqual('bad verify')
            done();
        })
    });

    test('handle fundingMgr.decodeTx fail', done => {
        fundingMgrMock.decodeTx.mockImplementationOnce( () => {throw new Error("decodeTx fail")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["badTx"],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32002)

            expect(err.error.message).toEqual('decodeTx fail')
            done();
        })
    });

    test.skip('handle token mismatch fail', done => {
        authMgrMock.verify.mockImplementationOnce( ()=>{ 
            return {
                payload: {
                    sub:'0x0'
                }
            }
        })
        
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32003)

            expect(err.error.message).toEqual('token mismatch. sub does not match `from` field in tx')
            done();
        })
    });

    test.skip('handle fundingMgr.fundingInfo fail', done => {
        fundingMgrMock.fundingInfo.mockImplementationOnce( () => {throw new Error("fundingInfo fail")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32004)

            expect(err.error.message).toEqual('fundingInfo fail')
            done();
        })
    });

    test('funding not needed (failed relayed call)', done => {
        rpn.mockImplementationOnce( (opt) => { throw Error('fail')} );
        fundingMgrMock.fundingInfo.mockReturnValueOnce({isFundingNeeded: false})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32000)
            expect(err.error.message).toEqual('fail')
            done();
        })
    });

    test('happy path funding not needed', done => {
        rpn.mockImplementationOnce( () => { return  {"id": 67, "jsonrpc": "2.0", "result": "0xtxHash"}} );
        fundingMgrMock.fundingInfo.mockReturnValueOnce({isFundingNeeded: false})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res).toEqual( {"id": 67, "jsonrpc": "2.0", "result": "0xtxHash"})
            done();
        })
    });

    test('handle abusing gasPrice', done => {
        fundingMgrMock.fundingInfo.mockImplementationOnce( () => {
            return { 
                isFundingNeeded: true,
                isAbusingGasPrice: true
            }    
        })
        
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32005)

            expect(err.error.message).toEqual('abusing gasPrice')
            done();
        })
    });

    test.skip('handle fundingMgr.fundingInfo fail', done => {
        fundingMgrMock.fundTx.mockImplementationOnce( () => {throw new Error("fundTx fail")})
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32006)

            expect(err.error.message).toEqual('fundTx fail')
            done();
        })
    });

    test.skip('handle happy path eth_sendRawTransaction', done => {
        const event = {
            pathParameters:{networkId:'4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":[rawTx],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res.id).toEqual(67)
            expect(res.result).toEqual("0xf699beb4d1436439e3c362c9f98ddd67a1cbe76b018bbe98c301677f17637724")
            done();
        })
    });


})

