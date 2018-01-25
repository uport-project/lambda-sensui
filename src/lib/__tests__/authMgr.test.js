const AuthMgr = require('../authMgr')

describe('AuthMgr', () => {

    let sut;
    let nisabaPub='033ee5fb940cb6803ac9b00f89011567d049e80c9066c5229078dde93da0872d67'
    let validToken="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiJuaXNhYmEudXBvcnQubWUiLCJpYXQiOjE1MTU3Mjk5MzUsImV4cCI6MTUxNTczMDUzNSwic3ViIjoiMHg5ZjdhMWU0MTAxOGZiYjk0Y2FhMTgyODFlNGQ2YWNmYzc3NTIxNjc5IiwiYXVkIjpbInVubnUudXBvcnQubWUiLCJzZW5zdWkudXBvcnQubWUiXSwicGhvbmVOdW1iZXIiOiI1Njk5ODcwNjk2MiJ9.nypufsTQD6EYMM6SRsuL4ODHPvLOph80G4avvrxGoBcWBpOZEZVQ7y-1putS8yk9LQXv3mEqrfefO8CPACEEEA"
    let invalidTokenSig="eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiIyb3B1YVZXQW5UNWVLdjFCN2dQY25nOE5kdjdYeTRhakFNMSIsImlhdCI6MTUwOTEzMTcwMCwiYXVkIjoiMm9lWHVmSEdEcFU1MWJmS0JzWkRkdTdKZTl3ZUozcjdzVkciLCJ0eXBlIjoibm90aWZpY2F0aW9ucyIsInZhbHVlIjoiYXJuOmF3czpzbnM6dXMtd2VzdC0yOjExMzE5NjIxNjU1ODplbmRwb2ludC9HQ00vdVBvcnQvZDlkM2EzMmEtNjc4NC0zYWMyLTk0ZjUtOGY5YTVkZDcxMmNhIiwiZXhwIjoxNTA5NzM2NTAwfQ.9aoOameGrjUakg_7BaBnK3_Ru2F65Cq6KJ2XCxTawfg1mVJAp61Yekjll5jlkKzBBVdqi3BNv8wj6zmCdgYvbm"
    

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
            expect(err).toEqual('nisabaPub not set')
            done()
        })
    });

    test('setSecrets', () => {
        expect(sut.isSecretsSet()).toEqual(false);
        sut.setSecrets({NISABA_PUBKEY: nisabaPub})
        expect(sut.isSecretsSet()).toEqual(true);
        expect(sut.nisabaPub).not.toBeUndefined()
        expect(sut.nisabaPub).toEqual(nisabaPub)
    });

    describe('verifyNisaba()', ()=>{

        test('no headers', (done) =>{
            sut.verifyNisaba({})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no headers')
                done()
            })
        })

        test('no headers', (done) =>{
            sut.verifyNisaba({headers:{}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no Authorization Header')
                done()
            })
        })

        test('fail auth format', (done) =>{
            sut.verifyNisaba({headers:{Authorization: 'aa'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('Format is Authorization: Bearer [token]')
                done()
            })
        })

        test('fail auth format2', (done) =>{
            sut.verifyNisaba({headers:{Authorization: 'Bier Token'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('Format is Authorization: Bearer [token]')
                done()
            })
        })
        test('fail invalid jwt', (done) =>{
            sut.verifyNisaba({headers:{Authorization: 'Bearer badtoken'}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('Invalid JWT token')
                done()
            })
        })
        test('fail invalid jwt signature', (done) =>{
            sut.verifyNisaba({headers:{Authorization: 'Bearer '+invalidTokenSig}})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('Invalid signature in JWT token')
                done()
            })
        })
        test('happy path', (done) =>{
            sut.verifyNisaba({headers:{Authorization: 'Bearer '+validToken}})
            .then((resp)=> {
                expect(resp.sub).toEqual('0x9f7a1e41018fbb94caa18281e4d6acfc77521679')
                done()
            })
            .catch( (err)=>{
                fail(err)
                done()
            })
        })
        


    })

})