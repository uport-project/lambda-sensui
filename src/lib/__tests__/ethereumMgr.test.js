jest.mock('pg')
import { Client } from 'pg'
let pgClientMock={
    connect:jest.fn(),
    end:jest.fn()
}
Client.mockImplementation(()=>{return pgClientMock});
const EthereumMgr = require('../ethereumMgr')

describe('EthereumMgr', () => {

    let sut;
    let seed= 'kitten lemon sea enhance poem grid calm battle never summer night express'
    let validMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
    let validSignedTx = 'f902660a63832dc6c094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba0aaaf27f6f21869b64ea2732030f1d96609a3d8be167951a0a8597f2c28c19d4ca04a5cbf3b3d5d4cf518b696027be3090d692836205a482e77483026e9f12521ff'

  
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


    describe('getNonce()', () =>{
        test('no address', (done) =>{
            sut.getNonce(null,'network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no address')
                done()
            })
        });

        test('no networkName', (done) =>{
            sut.getNonce('address',null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        });

        test('throw exception', (done) =>{
            pgClientMock.connect.mockImplementation(()=>{
                throw("throwed error")
            });
            sut.getNonce('address','network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('throwed error')
                done()
            })
        });

        test('happy path', (done) =>{
            pgClientMock.connect=jest.fn()
            pgClientMock.connect.mockClear()
            pgClientMock.end.mockClear()
            pgClientMock.query=jest.fn(()=>{ 
                return Promise.resolve({
                    rows:[{
                        nonce: 10
                    }]
                })})
            sut.getNonce('address','network')
            .then((resp)=> {
    
                expect(pgClientMock.connect).toBeCalled()
                expect(pgClientMock.query).toBeCalled()
                expect(pgClientMock.query).toBeCalledWith(
            "INSERT INTO nonces(address,network,nonce) \
             VALUES ($1,$2,0) \
        ON CONFLICT (address,network) DO UPDATE \
              SET nonce = nonces.nonce + 1 \
            WHERE nonces.address=$1 \
              AND nonces.network=$2 \
        RETURNING nonce;"
               ,[ 'address', 'network']);
                expect(pgClientMock.end).toBeCalled()
                expect(resp).toEqual(10)
                done()
            })
        });
    })

    describe('signTx()', ()=> {
        test('no txHex', (done) =>{
            sut.signTx({blockchain:'network'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no txHex')
                done()
            })
        });

        test('no blockchain', (done) =>{
            sut.signTx({txHex:'fae'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no blockchain')
                done()
            })
        });

        test('happy path', (done)=>{
            let i={
                txHex: validMetaSignedTx,
                blockchain: 'network'
            }
            sut.signTx(i)
            .then((resp)=> {
                expect(resp).toEqual(validSignedTx)
                done()
            })
        })

        test('signRawTx fail', (done)=>{
            let i={
                txHex: validMetaSignedTx,
                blockchain: 'network'
            }
            sut.signer.signRawTx=jest.fn()
            sut.signer.signRawTx.mockImplementation((rawTx,cb)=>{
                cb('failed');
            })
            sut.signTx(i)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('failed')
                done()
            })
        })
    })

    describe('sendRawTransaction()', ()=> {
        test('no signedRawTx', (done) =>{
            sut.sendRawTransaction(null,'network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no signedRawTx')
                done()
            })
        });

        test('no networkName', (done) =>{
            sut.sendRawTransaction(validSignedTx ,null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        });

        test('happy path (no 0x)', (done) =>{
            sut.web3s['network']={
                eth:{
                    sendRawTransactionAsync: jest.fn()
                }
            }
            sut.sendRawTransaction(validSignedTx ,'network')
            .then((resp)=> {
                expect(sut.web3s['network'].eth.sendRawTransactionAsync)
                        .toBeCalledWith('0x'+validSignedTx)
                done()
            })
        });

        test('happy path (with 0x)', (done) =>{
            sut.web3s['network']={
                eth:{
                    sendRawTransactionAsync: jest.fn()
                }
            }
            sut.sendRawTransaction('0x'+validSignedTx ,'network')
            .then((resp)=> {
                expect(sut.web3s['network'].eth.sendRawTransactionAsync)
                        .toBeCalledWith('0x'+validSignedTx)
                done()
            })
        });
    })

    describe('sendTransaction()', ()=> {
        test('no txObj', (done) =>{
            sut.sendTransaction(null,'network')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no txObj')
                done()
            })
        });

        test('no networkName', (done) =>{
            sut.sendTransaction({} ,null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        });

        test.skip('happy path', (done) =>{
            sut.signer.signRawTx=jest.fn()
            sut.signer.signRawTx.mockImplementation((rawTx,cb)=>{
                cb(null,'0xabcdef');
            })
            sut.web3s['network']={
                eth:{
                    sendRawTransactionAsync: jest.fn()
                }
            }
            let txObj={
                to:'0x1',
                value:10
            }
            sut.sendRawTransaction(txObj ,'network')
            .then((resp)=> {
                expect(sut.web3s['network'].eth.sendRawTransactionAsync)
                        .toBeCalledWith('0x')
                done()
            })
        });

    })


})