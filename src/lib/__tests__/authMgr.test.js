const { Credentials } = require('uport-credentials')
const {did, privateKey} = Credentials.createIdentity();
const credentials = new Credentials({
    appName: 'Test App', did, privateKey
})

const sutMgr = require('../authMgr');

describe('AuthMgr', () => {
    
    let sut;
    let validToken;

    beforeAll((done) =>{
        sut = new sutMgr();

        credentials.createVerification({
            sub: '0x0',
            claims: {valid: 'Token'}
        }).then((token)=>{
            validToken=token;
        }).then(done);
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });


    describe("verify()", () => {

        test('no token', (done)=> {
            sut.verify()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no authToken')
                done()
            })
        })

        test('invalid token', (done)=> {
            sut.verify("badtoken")
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('Incorrect format JWT')
                done()
            })
        })

        test('valid token', (done)=> {
            sut.verify(validToken)
            .then((resp)=> {
                expect(resp).not.toBeNull();
                expect(resp.issuer).toEqual(did)
                done();
            })
            .catch( (err)=>{
                fail(err); done()
            })
        })


    })
});
