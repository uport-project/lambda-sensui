import AWS from "aws-sdk";
import MockAWS from "aws-sdk-mock";
MockAWS.setSDKInstance(AWS);

const apiHandler = require('../api_handler');

describe('apiHandler', () => {

    
    beforeAll(()=>{
        MockAWS.mock("KMS", "decrypt", Promise.resolve({Plaintext:"{}"}));
        process.env.SECRETS="badSecret"
    })

    test('fund()', done => {
        apiHandler.fund({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            
            done();
        })
    });

    test('relay()', done => {
        apiHandler.relay({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            
            done();
        })
    });

});
