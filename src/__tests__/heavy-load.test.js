const networks = require('../lib/networks')
const MetaTestRegistry = require('./MetaTestRegistry')
const UportIdentity = require('uport-identity')
const TestRPC = require('ganache-cli')
const Transaction = require('ethereumjs-tx')
const Contract = require('truffle-contract')
const Web3 = require('web3')
const Promise = require('bluebird')
const EthSigner = require('eth-signer')

const RelayHandler = require('../api-v2/relay')
const EthereumMgr = require('../lib/ethereumMgr')

const generators = EthSigner.generators
const txutils = EthSigner.txutils
const TxRelaySigner = EthSigner.signers.TxRelaySigner
const KeyPair = Promise.promisifyAll(EthSigner.generators.KeyPair)

const rpcPort = 8555
const testNetwork = 'test'
const LOG_NUMBER = 12341234
const SEED = 'actual winner member hen nose buddy strong ball stove supply stick acquire'


describe('lambda relay stress test', () => {

  let relay1
  let relay2
  let relay3
  let server
  let web3
  let user1
  let user2
  let txRelay
  let txParams
  let metaTestReg

  beforeAll(async () => {
    console.log('This test runs with a 5 sec blocktime. Will take long to run.')
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    server = TestRPC.server({blocktime: 5})
    server = Promise.promisifyAll(server)
    await server.listenAsync(rpcPort)
    web3 = new Web3(server.provider)
    web3.eth = Promise.promisifyAll(web3.eth)
    web3.version = Promise.promisifyAll(web3.version)
    const netVersion = await web3.version.getNetworkAsync()
    const accounts = await web3.eth.getAccountsAsync()
    user1 = accounts[0]
    user2 = accounts[1]
    txParams = {from: user1, gas: 2000000}

    const txRelayArtifact = UportIdentity.TxRelay.v2
    let TxRelay = new Contract(txRelayArtifact)
    TxRelay.setProvider(server.provider)
    console.log('deploy txRelay')
    txRelay = await TxRelay.new(txParams)
    console.log('done')
    // mock the local testnet
    networks[testNetwork] = {id: netVersion, rpcUrl: 'http://localhost:8555'}
    txRelayArtifact.networks[netVersion] = {
      address: txRelay.address,
      links: {}
    }
    let MetaTestRegistryContract = Contract(MetaTestRegistry)
    MetaTestRegistryContract.setProvider(server.provider)
    console.log('deploy testReg')
    metaTestReg = await MetaTestRegistryContract.new(txParams)
    console.log('done')

    let ethereumMgr = new EthereumMgr(process.env.PG_URL)
    relay1 = new RelayHandler(ethereumMgr, SEED)
    ethereumMgr = new EthereumMgr(process.env.PG_URL)
    relay2 = new RelayHandler(ethereumMgr, SEED)
    ethereumMgr = new EthereumMgr(process.env.PG_URL)
    relay3 = new RelayHandler(ethereumMgr, SEED)
  })

  test('heavy load on one relay instance', async () => {
    let txHashes = []
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    // if something goes wrong all txs will not get mined
    // and the test will fail because it doesn't finish in time
    await waitUntilMined(txHashes)
  })

  test('heavy load on multiple relay instances', async () => {
    let txHashes = []
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay1))
    txHashes.push(await relayNewTx(relay2))
    txHashes.push(await relayNewTx(relay2))
    txHashes.push(await relayNewTx(relay2))
    // if something goes wrong all txs will not get mined
    // and the test will fail because it doesn't finish in time
    await waitUntilMined(txHashes)
  })

  afterAll(() => {
    server.close()
  })

  async function waitUntilMined(txHashes) {
    let delay = () => new Promise((resolve, reject) => setTimeout(resolve, 100))
    let mined = []
    while(txHashes.length) {
      for (let h of txHashes) {
        let tx = await web3.eth.getTransactionAsync(h)
        if (tx) {
          txHashes.splice(txHashes.indexOf(h), 1)
          mined.push(h)
          console.log('mined:', h, '\nbn:', tx.blockNumber)
        }
      }
      await delay()
    }
  }

  async function relayNewTx(relay) {
    const keypair = await KeyPair.generateAsync()
    const txRelaySigner = Promise.promisifyAll(new TxRelaySigner(keypair, txRelay.address, '0x54d6a9e7146bf3a81037eb8c468c472ef77ab529', '0x0000000000000000000000000000000000000000'))
    const types = ['address', 'uint256']
    const params = [keypair.address, LOG_NUMBER]
    const data = '0x' + txutils._encodeFunctionTxData('register', types, params)
    const nonce = (await txRelay.getNonce(keypair.address)).toNumber()

    const tx = new Transaction({
      value: 0,
      to: metaTestReg.address,
      data,
      nonce
    })
    const rawTx = '0x' + tx.serialize().toString('hex')
    const metaSignedTx = await txRelaySigner.signRawTxAsync(rawTx)

    const decTx = TxRelaySigner.decodeMetaTx(metaSignedTx)
    console.log('send tx to relay')
    return await relay.handle({
      metaSignedTx,
      blockchain: testNetwork
    })
  }
})
