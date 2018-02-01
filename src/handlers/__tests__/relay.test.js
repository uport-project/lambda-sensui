const RelayHandler = require('../relay');


const validMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const invalidMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a987234982edb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const validSignedTx = 'f9026b808504a817c800832dc6c094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba092f4dd8b8e2c83dd6db728dd2c13b4ac14acc51d4dab71bac67540e6932d4b61a04617eb3874c095ce9e272d22a99af9ca5084dc3d3a212438b8e3b71690f69979'

const validClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'
const invalidClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'


describe('RelayHandler', () => {

  let sut
  let authMgr
  let ethereumMgr
  let metaTxMgr

  beforeAll(() => {
    authMgr = {
      verifyNisaba: jest.fn()
    }
    metaTxMgr = {
      isMetaSignatureValid: jest.fn(),
      decodeMetaTx: jest.fn()
    }

    ethereumMgr = {
      signTx: jest.fn(),
      sendRawTransaction: jest.fn()
    }
    sut = new RelayHandler(authMgr,ethereumMgr,metaTxMgr)
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  describe('handle', () => {
    test('handle no body', async () => {

      await sut.handle(undefined, null, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('no json body')
      })
    })

    test('handle no json body', async () => {

      await sut.handle({body: 'notjson'}, null, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('no json body')
      })
    })

    test('handle no metaSignedTx', async () => {
      let event = {
        body: JSON.stringify({ blockchain: "test" })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('metaSignedTx parameter missing')
      })
    })

    test('handle no blockchain', async () => {
      let event = {
        body: JSON.stringify({ metaSignedTx: "0x123" })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('blockchain parameter missing')
      })
    })

    test('handle metaTxSigned with 0x', async()=>{
      let event = {
        body: JSON.stringify({ metaSignedTx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(metaTxMgr.isMetaSignatureValid).toBeCalledWith({
          metaSignedTx: "123456789", 
          blockchain: 'test'
        })
      })
    })

    test('handle invalid metaSignedTx', async () => {
      let event = {
        body: JSON.stringify({ metaSignedTx: invalidMetaSignedTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('MetaTx signature invalid')
      })
    })

    test('handle token mismatch', async () => {
      authMgr.verifyNisaba.mockImplementation(()=>{return {sub:'0xe4c7b7aba88156a3caf4c7bdaf5d3cbd6229081b'}})
      metaTxMgr.isMetaSignatureValid.mockImplementation(()=>{return true})
      metaTxMgr.decodeMetaTx.mockImplementation(()=>{return {claimedAddress: '0x'}})
      let event = {
        body: JSON.stringify({ metaSignedTx: validMetaSignedTx, blockchain: 'test' })
      }
      
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('Auth token mismatch. Does not match `claimedAddress` field in metatx')
      })
    })


    test('handle failed ethereumMgr.signTx', async () => {
      metaTxMgr.decodeMetaTx.mockImplementation(()=>{return {claimedAddress:'0xe4c7b7aba88156a3caf4c7bdaf5d3cbd6229081b'}})
      ethereumMgr.signTx.mockImplementation(()=>{throw({message:'failed'})}) 
      let bodyRaw={ metaSignedTx: validMetaSignedTx, blockchain: 'test' }
      let event = {
        body: JSON.stringify(bodyRaw)
      }
      await sut.handle(event, {}, (err, txHash) => {
        expect(metaTxMgr.isMetaSignatureValid).toBeCalledWith(bodyRaw)
        expect(ethereumMgr.signTx).toBeCalledWith({
          txHex:bodyRaw.metaSignedTx, 
          blockchain: bodyRaw.blockchain
        })
        expect(err.code).toEqual(500)
        expect(err.message).toEqual('failed')
        expect(txHash).toBeUndefined()
        
      })
    })


    test('handle failed ethereumMgr.sendRawTransaction', async () => {
      metaTxMgr.isMetaSignatureValid.mockImplementation(()=>{return true})
      ethereumMgr.signTx.mockImplementation(()=>{return validSignedTx}) 
      ethereumMgr.sendRawTransaction.mockImplementation(()=>{throw({message:'failed'})}) 
      let bodyRaw={ metaSignedTx: validMetaSignedTx, blockchain: 'test' }
      let event = {
        body: JSON.stringify(bodyRaw)
      }
      await sut.handle(event, {}, (err, txHash) => {
        expect(metaTxMgr.isMetaSignatureValid).toBeCalledWith(bodyRaw)
        expect(ethereumMgr.signTx).toBeCalledWith({
          txHex:bodyRaw.metaSignedTx, 
          blockchain: bodyRaw.blockchain
        })
        expect(ethereumMgr.sendRawTransaction).toBeCalledWith(validSignedTx,'test')
        expect(err.code).toEqual(500)
        expect(err.message).toEqual('failed')
        expect(txHash).toBeUndefined()
        
      })
    })

    test('handle correct metaSignedTx', async () => {
      metaTxMgr.isMetaSignatureValid.mockImplementation(()=>{return true})
      ethereumMgr.signTx.mockImplementation(()=>{return validSignedTx}) 
      ethereumMgr.sendRawTransaction.mockImplementation(()=>{return '0x12312342345'}) 
      let bodyRaw={ metaSignedTx: validMetaSignedTx, blockchain: 'test' }
      let event = {
        body: JSON.stringify(bodyRaw)
      }
      await sut.handle(event, {}, (err, txHash) => {
        expect(metaTxMgr.isMetaSignatureValid).toBeCalledWith(bodyRaw)
        expect(ethereumMgr.signTx).toBeCalledWith({
          txHex:bodyRaw.metaSignedTx, 
          blockchain: bodyRaw.blockchain
        })
        expect(ethereumMgr.sendRawTransaction).toBeCalledWith(validSignedTx,'test')
        expect(err).toBeNull()
        expect(txHash).toEqual('0x12312342345')
        
      })
    })
  })
})
