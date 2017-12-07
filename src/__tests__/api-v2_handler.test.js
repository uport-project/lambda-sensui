const networks = require('../lib/networks')
const MetaTestRegistry = require('./MetaTestRegistry')
const UportIdentity = require('uport-identity')
const TestRPC = require('ganache-cli')
const Transaction = require('ethereumjs-tx')
const Contract = require('truffle-contract')
const Web3 = require('web3')
const Promise = require('bluebird')
const EthSigner = require('eth-signer')

const generators = EthSigner.generators
const txutils = EthSigner.txutils
const TxRelaySigner = EthSigner.signers.TxRelaySigner
const KeyPair = Promise.promisifyAll(EthSigner.generators.KeyPair)

const validMetaSignedTx = 'f902068080831e848094416250ebf2123e1785d7bc122ce42d58e605fc6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001c494a85b05b71ff023ec7fa3115c287f2db0565575453c056af7247ec7bd23ea015627fb7ebabeedc8c72fdb3a5fd478b532ab00478bae0478b355a778522d2f10000000000000000000000005f866f8de6bf4421426d6257e97342a6bc30e0a100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000dd847754915f464c4c1c2503e1a86cd2501dcdfe0000000000000000000000007e088e7ca9b688a531494f5000d41ff04968f9e5000000000000000000000000270bcfbc0e8e24f2189d7de9bb46d74e219d5f43000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000002620c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080'
const invalidMetaSignedTx = 'f902068080831e848094c67bce9957c8a593753eeabc57bba1cf09163e6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001b0a922c900621b84babc77d255049939eec3bb82389d5e6e21ca748c522090cab4a31590270faa377124100f1db89c3cbd07a59e208ae0fa5d502242cc7d5d970000000000000000000000000a80e11593aff7ce20c6818e73ed78841912b3f2000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000891349787dcab0af52642a976b652449aca23f0b0000000000000000000000004449004968111f12947e1cf60cbe6dd61cb168140000000000000000000000009d380e95d54fb868251fc62b252eec4c42d692d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e00000000000000000000000000000000000000000000000000000000000220fe00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c4080'

const rpcPort = 8555
const testNetwork = 'test'
const SEED = 'actual winner member hen nose buddy strong ball stove supply stick acquire'
process.env.SEED = SEED

describe('lambda relay', () => {

  let relay
  let server
  let web3
  let user1
  let user2
  let txRelay
  let txParams

  beforeAll(async () => {
    server = TestRPC.server()//{gasLimit: 4000000000000})
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
    txRelay = await TxRelay.new(txParams)
    // mock the local testnet
    networks[testNetwork] = {id: netVersion, rpcUrl: 'http://localhost:8555'}
    txRelayArtifact.networks[netVersion] = {
      address: txRelay.address,
      links: {}
    }
    relay = require('../api-v2_handler').relay
  })

  describe('faulty requests', () => {
    test('empty body', done => {
      relay(null, null, (err, response) => {
        expect(response).toMatchObject({
          statusCode: 400,
          body: {
            status: 'error',
            message: expect.stringMatching(/no body/)
          }
        })
        done()
      })
    })

    test('no metaSignedTx', done => {
      relay({}, null, (err, response) => {
        expect(response).toMatchObject({
          statusCode: 400,
          body: {
            status: 'error',
            message: expect.stringMatching(/metaSignedTx/)
          }
        })
        done()
      })
    })

    test('no blockchain', done => {
      relay({metaSignedTx: '0x123'}, null, (err, response) => {
        expect(response).toMatchObject({
          statusCode: 400,
          body: {
            status: 'error',
            message: expect.stringMatching(/blockchain/)
          }
        })
        done()
      })
    })

    test('invalid meta signature', done => {
      relay({
        metaSignedTx: invalidMetaSignedTx,
        blockchain: testNetwork
      }, null, (err, response) => {
        expect(response).toMatchObject({
          statusCode: 403,
          body: {
            status: 'error',
            message: expect.stringMatching(/Meta signature invalid/)
          }
        })
        done()
      })
    })
  })

  describe('correct requests', () => {

    let metaTestReg

    beforeAll(async () => {
      let MetaTestRegistryContract = Contract(MetaTestRegistry)
      MetaTestRegistryContract.setProvider(server.provider)
      metaTestReg = await MetaTestRegistryContract.new(txParams)
    })

    test('valid meta signature', async done => {
      const keypair = await KeyPair.generateAsync()
      const txRelaySigner = Promise.promisifyAll(new TxRelaySigner(keypair, txRelay.address, '0x54d6a9e7146bf3a81037eb8c468c472ef77ab529', '0x0000000000000000000000000000000000000000'))
      const LOG_NUMBER = 12341234
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
      relay({
        metaSignedTx,
        blockchain: testNetwork
      }, null, async (err, response) => {
        expect(response).toMatchObject({
          statusCode: 200,
          body: {
            status: 'success',
            txHash: expect.stringMatching(/0x/)
          }
        })
        const regNum = await metaTestReg.registry(keypair.address)
        expect(regNum.toNumber()).toEqual(LOG_NUMBER)
        done()
      })
    })
  })

  afterAll(() => {
    server.close()
  })
})
