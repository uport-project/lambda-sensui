const AWS = require("aws-sdk");
const MockAWS = require ("aws-sdk-mock");
MockAWS.setSDKInstance(AWS);

const apiHandler = require('../api_handler');

describe('apiHandler', () => {

    beforeAll(() => {
        MockAWS.mock("KMS", "decrypt", Promise.resolve({Plaintext: "{}"}));
        process.env.SECRETS="fakesecrets";
    })

    test('rpc()', done => {
        apiHandler.rpc({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            
            done();
        })
    });

});
