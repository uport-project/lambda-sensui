const RelayHandler = require('../relay');

const validMetaSignedTx = 'f902068080831e848094416250ebf2123e1785d7bc122ce42d58e605fc6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001c494a85b05b71ff023ec7fa3115c287f2db0565575453c056af7247ec7bd23ea015627fb7ebabeedc8c72fdb3a5fd478b532ab00478bae0478b355a778522d2f10000000000000000000000005f866f8de6bf4421426d6257e97342a6bc30e0a100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000dd847754915f464c4c1c2503e1a86cd2501dcdfe0000000000000000000000007e088e7ca9b688a531494f5000d41ff04968f9e5000000000000000000000000270bcfbc0e8e24f2189d7de9bb46d74e219d5f43000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000002620c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const invalidMetaSignedTx = 'f902068080831e848094c67bce9957c8a593753eeabc57bba1cf09163e6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001b0a922c900621b84babc77d255049939eec3bb82389d5e6e21ca748c522090cab4a31590270faa377124100f1db89c3cbd07a59e208ae0fa5d502242cc7d5d970000000000000000000000000a80e11593aff7ce20c6818e73ed78841912b3f2000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000891349787dcab0af52642a976b652449aca23f0b0000000000000000000000004449004968111f12947e1cf60cbe6dd61cb168140000000000000000000000009d380e95d54fb868251fc62b252eec4c42d692d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e00000000000000000000000000000000000000000000000000000000000220fe00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c4080'
const validSignedTx = 'f902468080831e848094416250ebf2123e1785d7bc122ce42d58e605fc6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001c494a85b05b71ff023ec7fa3115c287f2db0565575453c056af7247ec7bd23ea015627fb7ebabeedc8c72fdb3a5fd478b532ab00478bae0478b355a778522d2f10000000000000000000000005f866f8de6bf4421426d6257e97342a6bc30e0a100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000dd847754915f464c4c1c2503e1a86cd2501dcdfe0000000000000000000000007e088e7ca9b688a531494f5000d41ff04968f9e5000000000000000000000000270bcfbc0e8e24f2189d7de9bb46d74e219d5f43000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000002620c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba0d2a9937aca3e05a6ccefde19fde62d401c766d7f00491387753171cc6df19e19a03b7bb2aace94c7044a2c1d211b66628199f0c5452aadc0b9b74f23f031bdced9'

const validClaimedAddress = '0xdd847754915f464c4c1c2503e1a86cd2501dcdfe'
const invalidClaimedAddress = '0x891349787dcab0af52642a976b652449aca23f0b'
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
        return '0x416250ebf2123e1785d7bc122ce42d58e605fc6d'
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
      await expect(relayHandler.handle()).rejects.toMatchObject({
        code: 400,
        message: expect.stringMatching(/no body/)
      })
    })

    test('handle no metaSignedTx', async () => {
      await expect(relayHandler.handle({})).rejects.toMatchObject({
        code: 400,
        message: expect.stringMatching(/metaSignedTx/)
      })
    })

    test('handle no metaSignedTx', async () => {
      await expect(relayHandler.handle({metaSignedTx: '0x123'})).rejects.toMatchObject({
        code: 400,
        message: expect.stringMatching(/blockchain/)
      })
    })

    test('handle invalid metaSignedTx', async () => {
      expectedClaimedAddress = invalidClaimedAddress
      await expect(relayHandler.handle({metaSignedTx: invalidMetaSignedTx, blockchain: 'test'})).rejects.toMatchObject({
        code: 403,
        message: 'Meta signature invalid'
      })
    })

    test('handle correct metaSignedTx', async () => {
      expectedClaimedAddress = validClaimedAddress
      ethereumMgr.sendRawTransaction = async metaSignedTx => {
        expect(metaSignedTx).toEqual(validSignedTx)
        return '0x12312342345'
      }
      const txHash = await relayHandler.handle({metaSignedTx: validMetaSignedTx, blockchain: 'test'})
      expect(txHash).toEqual('0x12312342345')
    })
  })
})
