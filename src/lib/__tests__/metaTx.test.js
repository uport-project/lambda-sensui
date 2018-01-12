jest.mock('truffle-contract')
import Contract from 'truffle-contract'
let contractMock={
    setProvider: jest.fn(),
    deployed:jest.fn()
}
Contract.mockImplementation(()=>{return contractMock});
const MetaTxMgr = require('../metaTxMgr')

describe('MetaTxMgr', () => {

    let sut;
    let mockEthereumMgr={
        getProvider: jest.fn()
    };
    const invalidMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a987234982edb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
    //TODO find a validMetaSignedTx (ajunge)
    const validMetaSignedTx =   'f9022b808504a817c800832dc6c094da8c6dce9e9a85e6f9df7b09b2354da44cb4833180b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001bacb3c0b5f7da08a03f3553d0ff4de37c549e5d5a21f2c30cea6286925d6cc0832d2046d92c4284ec3b343bf90f5c1ec17ef5574ee6e604d77cd5b32a02fe76a800000000000000000000000087ea811785c4bd30fc104c2543cf8ed90f7eeec700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000e4c7b7aba88156a3caf4c7bdaf5d3cbd6229081b000000000000000000000000c0d9155d09478b7be33140f0dcfca608ad347c3f00000000000000000000000071845bbfe5ddfdb919e780febfff5eda62a30fdc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024b6608467000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
    const validRelayerAddress = '0xda8c6dce9e9a85e6f9df7b09b2354da44cb48331'

    
    beforeAll(() => {
        sut = new MetaTxMgr(mockEthereumMgr);
        mockEthereumMgr.getProvider.mockImplementation(() => { return {} } )

        contractMock.deployed.mockImplementation(() =>{
            return {
                address: validRelayerAddress,
                getNonce: () => { return 0}
            }
        })
    });

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
        expect(sut.ethereumMgr).not.toBeUndefined();
        expect(sut.txRelayers).not.toBeUndefined();
    });

    describe('initTxRelayer()', () => {

        test('no networkName', (done) => {
            sut.initTxRelayer()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        })
    
        test('null provider for networkName', (done) => {
            mockEthereumMgr.getProvider.mockImplementationOnce(()=>{ 
                return null;   
            })
            sut.initTxRelayer('nonExistentNetworkName')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('null provider')
                done()
            })
        })

        test('happy path', (done) => {
            sut.initTxRelayer('network')
            .then((resp)=> {
                expect(contractMock.setProvider).toHaveBeenCalled()
                expect(contractMock.deployed).toHaveBeenCalled()
                done()
            })
        })
    
    })


    describe('getRelayerAddress()', () => {
        test('no networkName', (done) => {
            sut.getRelayerAddress()
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        })

        test('happy path', (done) => {
            sut.getRelayerAddress('network')
            .then((resp)=> {
                expect(resp).toEqual(validRelayerAddress)
                done()
            })
        })

    })

    describe('getRelayNonce()', () => {
        test('no address', (done) => {
            sut.getRelayNonce(null,'networkName')
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no address')
                done()
            })
        })

        test('no networkName', (done) => {
            sut.getRelayNonce('address',null)
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no networkName')
                done()
            })
        })

        test('happy path', (done) => {
            sut.getRelayNonce('address','network')
            .then((resp)=> {
                expect(resp).toEqual('0')
                done()
            })
        })
    })

    describe('isMetaSignatureValid()', () => {
        test('no metaSignedTx', (done) =>{
            sut.isMetaSignatureValid({blockchain:'network'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no metaSignedTx')
                done()
            })
        })

        test('no blockchain', (done) =>{
            sut.isMetaSignatureValid({metaSignedTx: invalidMetaSignedTx})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no blockchain')
                done()
            })
        })

        test('bad metaSignedTx', (done) =>{
            sut.isMetaSignatureValid({metaSignedTx: 'badtx',blockchain: 'network'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.toString()).toEqual('TypeError: Invalid hex string')
                done()
            })
        })

        test('invalid metaSignedTx', (done) =>{
            sut.isMetaSignatureValid({metaSignedTx: invalidMetaSignedTx,blockchain: 'network'})
            .then((resp)=> {
                expect(resp).toEqual(false);done()
            })
            .catch( (err)=>{
                fail(err.toString())
                done()
            })
        })

        //TODO: fix this test (need a validMetaSignedTx)
        test('valid metaSignedTx', (done) =>{
            sut.isMetaSignatureValid({metaSignedTx: validMetaSignedTx,blockchain: 'network'})
            .then((resp)=> {
                expect(resp).toEqual(true);done()
            })
            .catch( (err)=>{
                fail(err.toString())
                done()
            })
        })
    })



    describe('getMetaTxFrom()', () => {
        test('no metaSignedTx', (done) =>{
            sut.getMetaTxFrom({blockchain:'network'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no metaSignedTx')
                done()
            })
        })

        test('no blockchain', (done) =>{
            sut.getMetaTxFrom({metaSignedTx: invalidMetaSignedTx})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err).toEqual('no blockchain')
                done()
            })
        })

        test('bad metaSignedTx', (done) =>{
            sut.getMetaTxFrom({metaSignedTx: 'badtx',blockchain: 'network'})
            .then((resp)=> {
                fail("shouldn't return"); done()
            })
            .catch( (err)=>{
                expect(err.toString()).toEqual('TypeError: Invalid hex string')
                done()
            })
        })

        test('happyPath', (done) =>{
            sut.getMetaTxFrom({metaSignedTx: validMetaSignedTx,blockchain: 'network'})
            .then((resp)=> {
                expect(resp).toEqual('0xe4c7b7aba88156a3caf4c7bdaf5d3cbd6229081b');done()
            })
            .catch( (err)=>{
                fail(err.toString())
                done()
            })
        })

        

    })
})