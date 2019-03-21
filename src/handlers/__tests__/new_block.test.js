const sutHandler = require('../new_block');

describe('NewBlockHandler', () => {

    let sut;

    let ethereumMgrMock = {
        releaseCompleted: jest.fn()
    };
    let fundingMgrMock = {
        retry: jest.fn()
    };

    beforeAll(async () => {
        sut = new sutHandler(ethereumMgrMock,fundingMgrMock);
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

    test('handle ethereumMgr.releaseCompleted fail', done => {
        ethereumMgrMock.releaseCompleted.mockImplementationOnce( () => {throw new Error("release fail")})
        const event = {
            pathParameters:{ networkId:'4'}
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(500)
            expect(err.message).toEqual('release fail')
            done();
        })
    });

    test('handle fundingMgr.retry fail', done => {
        fundingMgrMock.retry.mockImplementationOnce( () => {throw new Error("retry fail")})
        const event = {
            pathParameters:{ networkId:'4'}
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).not.toBeNull()
            expect(err.code).toEqual(500)
            expect(err.message).toEqual('retry fail')
            done();
        })
    });

    test('happy path', done => {
        const event = {
            pathParameters:{ networkId:'4'}
        }
        sut.handle(event,null,(err,res)=>{
            expect(err).toBeNull()
            expect(res).toEqual("OK")
            done();
        })
    });

    


})