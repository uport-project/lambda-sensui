const networks = require('../networks')
const EthereumMgr = require('../ethereumMgr')
const UportIdentity = require('uport-identity')
const TestRPC = require('ethereumjs-testrpc')
const Contract = require('truffle-contract')
const Web3 = require('web3')
const Promise = require('bluebird')
const signers = require('eth-signer').signers

jest.mock('pg')
import { Client } from 'pg'
let pgClientMock = {
  connect: jest.fn(),
  end: jest.fn()
}
Client.mockImplementation(() => { return pgClientMock });

const rpcPort = 8555
const testNetwork = 'test'

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
    pgClientMock.connect = jest.fn()
    pgClientMock.connect.mockClear()
    pgClientMock.end.mockClear()
    pgClientMock.query = jest.fn(() => { return Promise.resolve("ok") })
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

  afterAll(() => {
    server.close()
  })
})
