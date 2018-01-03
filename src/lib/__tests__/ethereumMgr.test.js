const EthereumMgr = require('../ethereumMgr')

describe('EthereumMgr', () => {

    let sut;
    let seed= 'kitten lemon sea enhance poem grid calm battle never summer night express'

  
    beforeAll(() => {
        sut = new EthereumMgr();
    });

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
        expect(sut.pgUrl).toBeNull();
        expect(sut.seed).toBeNull();
        expect(sut.web3s).not.toEqual({});
        expect(sut.gasPrices).not.toEqual({});
        
    });

    test('is isSecretsSet', () => {
        let secretSet=sut.isSecretsSet()
        expect(secretSet).toEqual(false);
    });

    test('getNonce() no pgUrl set', (done) =>{
        sut.getNonce('a','n')
        .then((resp)=> {
            fail("shouldn't return"); done()
        })
        .catch( (err)=>{
            expect(err).toEqual('no pgUrl set')
            done()
        })
    });

    test('setSecrets', () => {
        expect(sut.isSecretsSet()).toEqual(false);
        sut.setSecrets({PG_URL: 'fake', SEED: seed})
        expect(sut.isSecretsSet()).toEqual(true);
        expect(sut.pgUrl).not.toBeUndefined()
        expect(sut.seed).not.toBeUndefined()
        expect(sut.signer).not.toBeUndefined()
    });

    test('getProvider() no networkName', (done) => {
        let p=sut.getProvider()
        expect(p).toBeNull();
        done();
    });

    test('getProvider() rinkeby', (done) =>{
        let p=sut.getProvider('rinkeby')
        expect(p).not.toBeNull();
        expect(p.host).toEqual("https://rinkeby.infura.io/")
        done();
    })

    describe('getBalance()', () => {

        test('no address', (done) =>{
            sut.getBalance(null,'network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no address')
                done()
            })
        });

        test('no networkName', (done) =>{
            sut.getBalance('address',null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        });

        test('no web3 for networkName', (done) =>{
            sut.getBalance('address','network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no web3 for networkName')
                done()
            })
        });

        test('happy path', (done) =>{
            sut.web3s['network']={
                eth:{
                    getBalanceAsync: jest.fn()
                }
            }
            sut.getBalance('address','network')
            .then((resp)=> {
                expect(sut.web3s['network'].eth.getBalanceAsync).toBeCalledWith('address')
                done()
            })
        });
    } )


    describe('getGasPrice()', () => {
        test('no networkName', (done) =>{
            sut.getGasPrice(null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        });

        test('no web3 for networkName', (done) =>{
            sut.gasPrices['network']=99
            sut.getGasPrice('network')
            .then((resp)=> {
                expect(resp).toEqual(99)
                done()
            })
        });

        test('happy path', (done) =>{
            sut.web3s['network']={
                eth:{
                    getGasPriceAsync: jest.fn()
                }
            }
            sut.getGasPrice('network')
            .then((resp)=> {
                expect(sut.web3s['network'].eth.getGasPriceAsync).toBeCalled()
                done()
            })
        });

    })

})