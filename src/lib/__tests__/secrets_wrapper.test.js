const AWS = require("aws-sdk");
const MockAWS = require("aws-sdk-mock");
MockAWS.setSDKInstance(AWS);

const createSecretsWrappedHandler = require('../secrets_wrapper');

describe('createSecretsWrappedHandler', () => {

    const secretsMgr={
        isSecretsSet: jest.fn().mockImplementation(()=>false),
        setSecrets: jest.fn()
    }

    beforeAll(() => {
        MockAWS.mock("KMS", "decrypt", Promise.resolve({Plaintext: "{}"}));
        process.env.SECRETS="badSecret";
    })

    test('secret not set', (done) => {
        const secretsMgrArr=[secretsMgr]
        const secretsHandler = createSecretsWrappedHandler(secretsMgrArr, (e,c,cb) => {
            cb("err","res");
            return;
         });
        secretsHandler({},{},(err,res)=>{
            expect(err).not.toBeNull()
            expect(err).toEqual("err")
            expect(res).not.toBeNull()
            expect(res).toEqual("res")
            done();
        })
    })

    test('secret set', (done) => {
        secretsMgr.isSecretsSet.mockImplementationOnce(()=>true)
        const secretsMgrArr=[secretsMgr]
        const secretsHandler = createSecretsWrappedHandler(secretsMgrArr, (e,c,cb) => {
            cb("err","res");
            return;
         });
        secretsHandler({},{},(err,res)=>{
            expect(err).not.toBeNull()
            expect(err).toEqual("err")
            expect(res).not.toBeNull()
            expect(res).toEqual("res")
            done();
        })
    })

});
