const RelayHandler = require('../relay');

const validMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const invalidMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a987234982edb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const validSignedTx = 'f9026b808504a817c800832dc6c094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba092f4dd8b8e2c83dd6db728dd2c13b4ac14acc51d4dab71bac67540e6932d4b61a04617eb3874c095ce9e272d22a99af9ca5084dc3d3a212438b8e3b71690f69979'

const validClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'
const invalidClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'
const validRelayAddress = '0xf17643d78c7a4430f375275a6e53851a139c37d3'

const seed = 'kitten lemon sea enhance poem grid calm battle never summer night express'


describe('RelayHandler', () => {

  let relayHandler
  let ethereumMgr
  let expectedClaimedAddress

  beforeAll(() => {
    //TODO: Provide a mocked version of the ethereumMgr
    ethereumMgr = {
      getRelayAddress: (networkName) => {
        expect(networkName).toEqual('test')
        return '0x326ba40a7d9951acd7414fa9d992dde2cd2ff906'
      },
      getRelayNonce: (address, networkName) => {
        expect(address).toEqual(expectedClaimedAddress)
        expect(networkName).toEqual('test')
        return '0'
      },
      getNonce: (address, networkName) => {
        expect(address).toEqual(validRelayAddress)
        expect(networkName).toEqual('test')
        return 0
      },
      getGasPrice: networkName => {
        return 20000000000
      }
    }
    relayHandler = new RelayHandler(ethereumMgr, seed)
  })

  test('empty constructor', () => {
    expect(relayHandler).not.toBeUndefined()
  })

  describe('isMetaSignatureValid', () => {
    test('not validate meta signature', async () => {
      expectedClaimedAddress = invalidClaimedAddress
      expect(await relayHandler.isMetaSignatureValid({
        metaSignedTx: invalidMetaSignedTx,
        blockchain: 'test'
      })).toBeFalsy()
    })

    test('validate meta signature', async () => {
      expectedClaimedAddress = validClaimedAddress
      // we just mock the signer address here since it is hardcoded in the validMetaSignedTx
      relayHandler.signer.getAddress = () => validRelayAddress
      expect(await relayHandler.isMetaSignatureValid({
        metaSignedTx: validMetaSignedTx,
        blockchain: 'test'
      })).toBeTruthy()
    })
  })

  describe('signTx', () => {
    test('signs a tx correctly', async () => {
      const signedRawTx = await relayHandler.signTx({
        metaSignedTx: validMetaSignedTx,
        blockchain: 'test'
      })
      expect(signedRawTx).toEqual(validSignedTx)
    })
  })

  describe('handle', () => {
    test('handle no body', async () => {

      await relayHandler.handle({}, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toMatch(/no json body/)
      })
    })

    test('handle no metaSignedTx', async () => {
      let event = {
        body: { blockchain: "test" }
      }
      await relayHandler.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toMatch(/metaSignedTx/)
      })
    })

    test('handle no blockchain', async () => {
      let event = {
        body: { metaSignedTx: "0x123" }
      }
      await relayHandler.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toMatch(/blockchain/)
      })
    })

    test('handle invalid metaSignedTx', async () => {
      expectedClaimedAddress = invalidClaimedAddress
      let event = {
        body: { metaSignedTx: invalidMetaSignedTx, blockchain: 'test' }
      }
      await relayHandler.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toMatch(/Meta signature invalid/)
      })
    })

    test('handle correct metaSignedTx', async () => {
      expectedClaimedAddress = validClaimedAddress
      ethereumMgr.sendRawTransaction = async metaSignedTx => {
        expect(metaSignedTx).toEqual(validSignedTx)
        return '0x12312342345'
      }
      let event = {
        body: { metaSignedTx: validMetaSignedTx, blockchain: 'test' }
      }
      await relayHandler.handle(event, {}, (err, txHash) => {
        expect(err).toBeNull()
        expect(txHash).toEqual('0x12312342345')
      })
    })
  })
})
