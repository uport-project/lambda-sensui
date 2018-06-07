const AuthMgr = require('../authMgr')

describe('AuthMgr', () => {

    let sut;
    let nisabaPub='033ee5fb940cb6803ac9b00f89011567d049e80c9066c5229078dde93da0872d67'
    let invalidTokenSig="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiIyb3B1YVZXQW5UNWVLdjFCN2dQY25nOE5kdjdYeTRhakFNMSIsImlhdCI6MTUwOTEzMTcwMCwiYXVkIjoiMm9lWHVmSEdEcFU1MWJmS0JzWkRkdTdKZTl3ZUozcjdzVkciLCJ0eXBlIjoibm90aWZpY2F0aW9ucyIsInZhbHVlIjoiYXJuOmF3czpzbnM6dXMtd2VzdC0yOjExMzE5NjIxNjU1ODplbmRwb2ludC9HQ00vdVBvcnQvZDlkM2EzMmEtNjc4NC0zYWMyLTk0ZjUtOGY5YTVkZDcxMmNhIiwiZXhwIjoxNTA5NzM2NTAwfQ.9aoOameGrjUakg_7BaBnK3_Ru2F65Cq6KJ2XCxTawfg1mVJAp61Yekjll5jlkKzBBVdqi3BNv8wj6zmCdgYvbm"
    let validToken="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiJuaXNhYmEudXBvcnQubWUiLCJpYXQiOjE1MTU3Mjk5MzUsImV4cCI6MTUxNTczMDUzNSwic3ViIjoiMHg5ZjdhMWU0MTAxOGZiYjk0Y2FhMTgyODFlNGQ2YWNmYzc3NTIxNjc5IiwiYXVkIjpbInVubnUudXBvcnQubWUiLCJzZW5zdWkudXBvcnQubWUiXSwicGhvbmVOdW1iZXIiOiI1Njk5ODcwNjk2MiJ9.nypufsTQD6EYMM6SRsuL4ODHPvLOph80G4avvrxGoBcWBpOZEZVQ7y-1putS8yk9LQXv3mEqrfefO8CPACEEEA"
    let validTokenDid="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1MjgzODQ5MTUsInR5cGUiOiJmdWVsIiwiZXhwIjoxNTU5OTIwOTE1LCJzdWIiOiIweDgyRDI0ZWU2RDM1YTQ0MjU2OTE5ZTQ2MzQ2MTMwOERhQkNCODI5NWYiLCJhbGxvd2VkIjpbInVubnU6OnJpbmtlYnk6KiIsInVubnU6OmtvdmFuOioiLCJ1bm51Ojpyb3BzdGU6KiJdLCJpc3MiOiJkaWQ6ZXRocjoweDJmMmY4OWRkNjlhNjg0ZjU2MjAwZjM5ZDlkOGE4YjgyMmQyMzlmZjMifQ.XKRdSNC2jeySZuVlLxZ5NqyQKKt_cTgT1vUHW-5juBJZINCbj8R4FHZSJFYeux-AGwFl4umWG0j8qtP4U38hzQA";
    let validTokenDidNotAllowed="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1MjgzODc0MzgsInR5cGUiOiJmdWVsIiwiZXhwIjoxNTU5OTIzNDM4LCJzdWIiOiIweEM5ZkZGNzgwNUIzNmE4ODVCNjc0QWI4QmE0OTM4MGM0YzExMjE4MzEiLCJhbGxvd2VkIjpbInVubnU6OnJpbmtlYnk6KiIsInVubnU6OmtvdmFuOioiLCJ1bm51Ojpyb3BzdGU6KiJdLCJpc3MiOiJkaWQ6ZXRocjoweDgyY2ZhNDhkYTNiNmZmNjAzZTRjMzIyM2NkOTlmOTA1ZGNlZGQ2MzgifQ.jc8SdQ_asEZ6Q2nj16ZlZPbsX_0pIgF0P0X-50PFgO3BFYmJay4gNkbjVmLiZymcd_ARpxoJSk2bFQDvW3vySAE";
    let allowedISS="did:ethr:0x2f2f89dd69a684f56200f39d9d8a8b822d239ff3"

    beforeAll(() => {
        sut = new AuthMgr();
    });

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
        expect(sut.nisabaPub).toBeNull();

    });

    test('is isSecretsSet', () => {
        let secretSet=sut.isSecretsSet()
        expect(secretSet).toEqual(false);
    });

    test('verifyNisaba() no nisabaPub set', (done) =>{
        sut.verifyNisaba({headers:{Authorization: 'aa'}})
        .then((resp)=> {
            fail("shouldn't return"); done()
        })
        .catch( (err)=>{
            expect(err.message).toEqual('nisabaPub not set')
            done()
        })
    });

    test('isIssAllowed() no allowedIss set', (done) =>{
        sut.isIssAllowed('')
        .then((resp)=> {
            fail("shouldn't return"); done()
        })
        .catch( (err)=>{
            expect(err.message).toEqual('allowedIss not set')
            done()
        })
    });

    
    test('setSecrets', () => {
        expect(sut.isSecretsSet()).toEqual(false);
        sut.setSecrets({
            NISABA_PUBKEY: nisabaPub,
            ALLOWED_ISS: allowedISS
        })
        expect(sut.isSecretsSet()).toEqual(true);
        expect(sut.nisabaPub).not.toBeUndefined()
        expect(sut.nisabaPub).toEqual(nisabaPub)
    });

    describe ('verifyFuelToken()', ()=> {
        test('no headers', (done) =>{
            sut.verifyFuelToken({})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no headers')
                done()
            })
        })

        test('no headers', (done) =>{
            sut.verifyFuelToken({headers:{}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('no Authorization Header')
                done()
            })
        })

        test('fail auth format', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'aa'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('Format is Authorization: Bearer [token]')
                done()
            })
        })

        test('fail auth format2', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bier Token'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('Format is Authorization: Bearer [token]')
                done()
            })
        })

        test('fail invalid jwt', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bearer badtoken'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('Invalid JWT token')
                done()
            })
        })
        test('fail invalid jwt signature', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bearer '+invalidTokenSig}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('Invalid signature in JWT token')
                done()
            })
        })

        test('happy path (old token)', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bearer '+validToken}})
            .then((resp)=> {
                expect(resp).toMatchSnapshot();
                done()
            })
            .catch( (err)=>{
                fail(err)
                done()
            })
        })

        test('fail not allowed iss', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bearer '+validTokenDidNotAllowed}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.message).toEqual('iss not allowed')
                done()
            })
        })


        test('happy path DID', (done) =>{
            sut.verifyFuelToken({headers:{Authorization: 'Bearer '+validTokenDid}})
            .then((resp)=> {
                expect(resp).toMatchSnapshot();
                done()
            })
            .catch( (err)=>{
                fail(err)
                done()
            })
        })

    })

    

})