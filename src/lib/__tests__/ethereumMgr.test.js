const networks = require('../networks')
const EthereumMgr = require('../ethereumMgr')
const UportIdentity = require('uport-identity')
const TestRPC = require('ethereumjs-testrpc')
const Contract = require('truffle-contract')
const Web3 = require('web3')
const Promise = require('bluebird')
const signers = require('eth-signer').signers


const rpcPort = 8555
const testNetwork = 'test'

const validMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const invalidMetaSignedTx = 'f902268080831e848094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a987234982edb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const validSignedTx = 'f9026b808504a817c800832dc6c094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba092f4dd8b8e2c83dd6db728dd2c13b4ac14acc51d4dab71bac67540e6932d4b61a04617eb3874c095ce9e272d22a99af9ca5084dc3d3a212438b8e3b71690f69979'

const validClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'
const invalidClaimedAddress = '0xd9a943e9569cb4fab09f66f6fa1adf965ad57973'
const validRelayAddress = '0xf17643d78c7a4430f375275a6e53851a139c37d3'

const seed = 'kitten lemon sea enhance poem grid calm battle never summer night express'



describe('EthereumMgr', () => {

  let ethereumMgr
  let server
  let web3
  let user1
  let user2
  let relayAddress

  beforeAll(async () => {
    server = TestRPC.server()
    server = Promise.promisifyAll(server)
    let blockchain = await server.listenAsync(rpcPort)
    const netVersion = blockchain.net_version
    const accounts = Object.keys(blockchain.accounts)
    user1 = accounts[0]
    user2 = accounts[1]
    const txParams = {from: user1, gas: 2000000}
    web3 = new Web3(server.provider)
    web3.eth = Promise.promisifyAll(web3.eth)

    const txRelayArtifact = UportIdentity.TxRelay.v2
    let TxRelay = new Contract(txRelayArtifact)
    TxRelay.setProvider(server.provider)
    let txRelay = await TxRelay.new(txParams)
    relayAddress = txRelay.address
    // mock the local testnet
    networks[testNetwork] = {id: netVersion, rpcUrl: 'http://localhost:8555'}
    txRelayArtifact.networks[netVersion] = {
      address: relayAddress,
      links: {}
    }
    ethereumMgr = new EthereumMgr()
    ethereumMgr.setSecrets({PG_URL: 'postgresql://root:sensui@localhost:5433/sensui', SEED: seed})
  })

  test('empty constructor', () => {
    expect(ethereumMgr.web3s).not.toBeUndefined()
  })

  test('getBalance', async () => {
    const realBalance = await web3.eth.getBalanceAsync(user1)
    const balance = await ethereumMgr.getBalance(user1, testNetwork)

    expect(balance).toEqual(realBalance)
  })

  test('getNonce', async () => {
    let nonce = await ethereumMgr.getNonce(user1, testNetwork)
    expect(nonce).toEqual(1)
    await web3.eth.sendTransactionAsync({from: user1, to: user2, value: 99})
    nonce = await ethereumMgr.getNonce(user1, testNetwork)
    expect(nonce).toEqual(2)
  })

  test('getRelayNonce', async () => {
    let nonce = await ethereumMgr.getRelayNonce(user2, testNetwork)
    expect(nonce).toEqual("0")
  })

  test('getRelayAddress', async () => {
    let address = await ethereumMgr.getRelayAddress(testNetwork)
    expect(address).toEqual(relayAddress)
  })

  test('getGasPrice', async () => {
    let price = await ethereumMgr.getGasPrice(testNetwork)
    expect(price).toEqual(20000000000)
  })

  describe('isMetaSignatureValid', () => {

    test('not validate meta signature', async () => {
      let expectedClaimedAddress = invalidClaimedAddress
      expect(await ethereumMgr.isMetaSignatureValid({
        metaSignedTx: invalidMetaSignedTx,
        blockchain: 'test'
      })).toBeFalsy()
    })

    test('validate meta signature', async () => {
      let expectedClaimedAddress = validClaimedAddress
      // we just mock the signer address here since it is hardcoded in the validMetaSignedTx
      ethereumMgr.signer.getAddress = () => validRelayAddress
      expect(await ethereumMgr.isMetaSignatureValid({
        metaSignedTx: validMetaSignedTx,
        blockchain: 'test'
      })).toBeTruthy()
    })
  })

  describe('signTx', () => {
    test('signs a tx correctly', async () => {
      const signedRawTx = await ethereumMgr.signTx({
        metaSignedTx: validMetaSignedTx,
        blockchain: 'test'
      })
      expect(signedRawTx).toEqual(validSignedTx)
    })
  })


  afterAll(() => {
    server.close()
    ethereumMgr.closePool()
  })
})
