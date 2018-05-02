import AWS from "aws-sdk";
import MockAWS from "aws-sdk-mock";
MockAWS.setSDKInstance(AWS);

import networks from '../lib/networks'
import MetaTestRegistry from './MetaTestRegistry'
import UportIdentity from 'uport-identity'
import TestRPC from 'ganache-cli'
import Transaction from 'ethereumjs-tx'
import Contract from 'truffle-contract'
import Web3 from 'web3'
import Promise from 'bluebird'
import bip39 from 'bip39'
import EthSigner from 'eth-signer'

jest.mock('pg')
import { Client } from 'pg'
let pgClientMock={
    connect: jest.fn(),
    query: () => { return { rows: [{nonce: 0}]} },
    end: jest.fn()
}
Client.mockImplementation(()=>{return pgClientMock});

const generators = EthSigner.generators
const txutils = EthSigner.txutils
const TxRelaySigner = EthSigner.signers.TxRelaySigner
const KeyPair = Promise.promisifyAll(EthSigner.generators.KeyPair)

const invalidMetaSignedTx = 'f902068080831e848094c67bce9957c8a593753eeabc57bba1cf09163e6d80b901e4b4fadcad000000000000000000000000000000000000000000000000000000000000001b0a922c900621b84babc77d255049939eec3bb82389d5e6e21ca748c522090cab4a31590270faa377124100f1db89c3cbd07a59e208ae0fa5d502242cc7d5d970000000000000000000000000a80e11593aff7ce20c6818e73ed78841912b3f2000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000891349787dcab0af52642a976b652449aca23f0b0000000000000000000000004449004968111f12947e1cf60cbe6dd61cb168140000000000000000000000009d380e95d54fb868251fc62b252eec4c42d692d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e00000000000000000000000000000000000000000000000000000000000220fe00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c4080'

const validAuthToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiJuaXNhYmEudXBvcnQubWUiLCJpYXQiOjE1MTU3Mjk5MzUsImV4cCI6MTUxNTczMDUzNSwic3ViIjoiMHg5ZjdhMWU0MTAxOGZiYjk0Y2FhMTgyODFlNGQ2YWNmYzc3NTIxNjc5IiwiYXVkIjpbInVubnUudXBvcnQubWUiLCJzZW5zdWkudXBvcnQubWUiXSwicGhvbmVOdW1iZXIiOiI1Njk5ODcwNjk2MiJ9.nypufsTQD6EYMM6SRsuL4ODHPvLOph80G4avvrxGoBcWBpOZEZVQ7y-1putS8yk9LQXv3mEqrfefO8CPACEEEA"

const rpcPort = 8555
const testNetwork = 'test'
const SEED = bip39.generateMnemonic()
process.env.SEED = SEED


describe('send MetaTx integration tests', () => {

  let apiHandler
  let server
  let web3
  let user1
  let user2
  let txRelay
  let txParams
  let senderKeyPair

  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 80000

    const Plaintext = '{"SEED": "' + SEED + '", "PG_URL": "http://url"}'
    MockAWS.mock("KMS", "decrypt", Promise.resolve({Plaintext}));
    process.env.SECRETS="badSecret"

    // mock authMgr
    senderKeyPair = await KeyPair.generateAsync()

    jest.mock('../lib/authMgr')
    const AuthMgr = require('../lib/authMgr')
    let authMgrMock = {
      setSecrets: jest.fn(),
      isSecretsSet: jest.fn(),
      verifyNisaba: () => { return { sub: senderKeyPair.address } }
    }
    AuthMgr.mockImplementation(()=>{return authMgrMock});

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

    // send eth to the relay
    const hdPrivKey = generators.Phrase.toHDPrivateKey(SEED)
    const signer = new EthSigner.signers.HDSigner(hdPrivKey)
    await web3.eth.sendTransactionAsync({
      to: signer.getAddress(),
      value: web3.toWei(1, 'ether'),
      from: user1,
      gas: 2000000
    })

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
    apiHandler = require('../api_handler')
  })

  test('send valid meta transaction', async done => {
    let MetaTestRegistryContract = Contract(MetaTestRegistry)
    MetaTestRegistryContract.setProvider(server.provider)
    let metaTestReg = await MetaTestRegistryContract.new(txParams)

    const keypair = senderKeyPair
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
    const event = {
      body: JSON.stringify({
        metaSignedTx,
        blockchain: testNetwork
      }),
      headers: {
        Authorization: 'Bearer' + validAuthToken
      }
    }
    apiHandler.relay(event, null, async (err, response) => {
      expect(response).toMatchObject({
        statusCode: 200,
        body: expect.stringMatching(/{\"status\":\"success\",\"data\":\"0x/)
      })
      const regNum = await metaTestReg.registry(keypair.address)
      expect(regNum.toNumber()).toEqual(LOG_NUMBER)
      done()
    })
  })


  afterAll(() => {
    server.close()
  })
})
