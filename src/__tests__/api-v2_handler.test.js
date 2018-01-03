import AWS from "aws-sdk";
import MockAWS from "aws-sdk-mock";
MockAWS.setSDKInstance(AWS);

const apiV1Handler = require('../api-v2_handler');

describe('apiV2Handler', () => {

    
    beforeAll(()=>{
        MockAWS.mock("KMS", "decrypt", Promise.resolve({Plaintext:"{}"}));
        process.env.SECRETS="badSecret"
    })

    test('relay()', done => {
        apiV1Handler.relay({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            
            done();
        })
    });

});
