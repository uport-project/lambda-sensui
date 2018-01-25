const FundHandler = require('../fund');



describe('FundHandler', () => {

  let sut
  let authMgr
  let txMgr
  let ethereumMgr

  let validTx = 'f902660a63832dc6c094326ba40a7d9951acd7414fa9d992dde2cd2ff90680b90204c3f44c0a000000000000000000000000000000000000000000000000000000000000001c41ee9c8324a88483cc81f0a5607c6a7aedb3528c211e4d8a2d37dd81f0c632c56d24858219d23e31bd0af8f5c0336c42881fbeff838c10f8c1dac3e4f8aba9950000000000000000000000009fa2369eebe2bd266ef14785fad6c8bed710c69600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104701b8826000000000000000000000000d9a943e9569cb4fab09f66f6fa1adf965ad57973000000000000000000000000ed7e78c43c8c86b45d24995017bd60a9dd45aa01000000000000000000000000cdb1d9895d1c28bb73260bdd49f2650ee5bd335d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f207564e000000000000000000000000000000000000000000000000000000000007611600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001ba0aaaf27f6f21869b64ea2732030f1d96609a3d8be167951a0a8597f2c28c19d4ca04a5cbf3b3d5d4cf518b696027be3090d692836205a482e77483026e9f12521ff'
  

  beforeAll(() => {
    authMgr = {
      verifyNisaba: jest.fn()
    }
    txMgr = {
      verify: jest.fn(),
      decode: jest.fn()
    }
    ethereumMgr = {
      getGasPrice: jest.fn(),
      getBalance: jest.fn(),
      sendTransaction: jest.fn()
    }
    sut = new FundHandler(authMgr,txMgr,ethereumMgr)
  })

  beforeEach(()=>{
    authMgr.verifyNisaba.mockReturnValue({sub: '0x434ed43244205757148ce1f05ffe3778bb40246e'})
    txMgr.verify.mockImplementation(()=>{return {} })
    txMgr.decode.mockReturnValue({
      gasPrice: 10,
      gasLimit: 100,
      from: '0x434ed43244205757148ce1f05ffe3778bb40246e'
    })
    ethereumMgr.getGasPrice.mockReturnValue(100)
    
      
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  describe('handle', () => {
    test('handle auth token', async () => {
      authMgr.verifyNisaba.mockImplementation(()=>{throw {message: 'failed'}});

      await sut.handle({}, {headers: []}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(401)
        expect(err.message).toEqual('failed')
      })
    })


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

    test('handle no tx', async () => {
      let event = {
        body: JSON.stringify({ blockchain: "test" })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('tx parameter missing')
      })
    })

    test('handle no blockchain', async () => {
      let event = {
        body: JSON.stringify({ tx: "0x123" })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('blockchain parameter missing')
      })
    })

    test('handle tx with 0x', async(done)=>{
      let event = {
        body: JSON.stringify({ tx: "0x"+validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(txMgr.verify).toBeCalledWith(validTx)
        done()
      })
    })

    test('handle tx without 0x', async(done)=>{
      let event = {
        body: JSON.stringify({ tx: validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(txMgr.verify).toBeCalledWith(validTx)
        done()
      })
    })

    test('handle failed txMgr.verify', async () => {
      txMgr.verify.mockImplementation(()=>{throw({message:'failed'})})
      let event = {
        body: JSON.stringify({ tx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(txMgr.verify).toBeCalledWith('123456789')
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('failed')
        expect(res).toBeUndefined()
        
      })
    })

    test('handle failed txMgr.decode', async () => {
      txMgr.decode.mockImplementation(()=>{throw({message:'failed'})})
      let event = {
        body: JSON.stringify({ tx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(txMgr.verify).toBeCalledWith('123456789')
        expect(txMgr.decode).toBeCalledWith({})
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('failed')
        expect(res).toBeUndefined()
        
      })
    })

    test('handle failed tx.from', async () => {
      txMgr.decode.mockReturnValue({from: '0xbad'})
      let event = {
        body: JSON.stringify({ tx: validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('Auth token mismatch. Does not match `from` field in tx')
        expect(res).toBeUndefined()
      })
    })

    test('handle failed ethereumMgr.getGasPrice', async () => {
      ethereumMgr.getGasPrice.mockImplementation(()=>{throw({message:'failed'})})
      let event = {
        body: JSON.stringify({ tx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err.code).toEqual(500)
        expect(err.message).toEqual('failed')
        expect(res).toBeUndefined()
      })
    })    

    test('handle failed abusing GasPrice', async () => {
      txMgr.decode.mockReturnValue({
        gasPrice: 10000,
        from: '0x434ed43244205757148ce1f05ffe3778bb40246e'
      })
      let event = {
        body: JSON.stringify({ tx: validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err.code).toEqual(429)
        expect(err.message).toEqual('tx.gasPrice too high. Not funding.')
        expect(res).toBeUndefined()
      })
    })
    
    test('handle failed ethereumMgr.getBalance', async () => {
      ethereumMgr.getBalance.mockImplementation(()=>{throw({message:'failed'})})
      let event = {
        body: JSON.stringify({ tx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err.code).toEqual(500)
        expect(err.message).toEqual('failed')
        expect(res).toBeUndefined()
      })
    })    

    test('handle failed enough balance', async () => {
      ethereumMgr.getBalance.mockReturnValue(1000000)

      let event = {
        body: JSON.stringify({ tx: validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        expect(err.code).toEqual(429)
        expect(err.message).toEqual('enough balance. Not sending funds')
        expect(res).toBeUndefined()
      })
    })


    test('handle failed ethereumMgr.sendTransaction', async () => {
      ethereumMgr.getBalance.mockReturnValue(1)
      ethereumMgr.sendTransaction.mockImplementation(()=>{throw({message:'failed'})})
      let event = {
        body: JSON.stringify({ tx: validTx, blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        //expect(err.code).toEqual(500)
        expect(err.message).toEqual('failed')
        expect(res).toBeUndefined()
      })
    }) 

  })
})
