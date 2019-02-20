jest.mock('request-promise-native');
const rpn = require('request-promise-native');

const sutHandler = require('../rpc');

describe('RpcHandler', () => {
    
    let sut;
    const authToken="faketoken";

    //Mocked Mgrs
    let authMgrMock={ verify: jest.fn().mockImplementation((a)=>{ return {iss:a}})};
    
    beforeAll(async () => {
        sut = new sutHandler(authMgrMock);
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
            pathParameters:{networkId:'0x4'}
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
            pathParameters:{networkId:'0x4', authToken: authToken }
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            done();
        })
    });

    test('failed relayed call', done => {
        rpn.mockImplementationOnce( (opt) => { throw Error('fail')} );
        const event = {
            pathParameters:{networkId:'0x4', authToken: authToken },
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
            pathParameters:{networkId:'0x4', authToken: authToken },
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
            pathParameters:{networkId:'0x4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675"],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.error).not.toBeNull()
            expect(err.error.code).toEqual(-32001)

            expect(err.error.message).toEqual('bad verify')
            done();
        })
    });

    test('handle happy path eth_sendRawTransaction', done => {
        const event = {
            pathParameters:{networkId:'0x4', authToken: authToken },
            body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675"],"id":67} 
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res.id).toEqual(67)
            expect(res.result).toEqual("0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331")
            done();
        })
    });


})

