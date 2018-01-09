const FundHandler = require('../fund');



describe('FundHandler', () => {

  let sut
  let ethereumMgr

  beforeAll(() => {
    ethereumMgr = {
      signTx: jest.fn(),
      sendRawTransaction: jest.fn()
    }
    sut = new FundHandler(ethereumMgr)
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
        body: JSON.stringify({ tx: "0x123456789", blockchain: 'test' })
      }
      await sut.handle(event, {}, (err, res) => {
        done()
      })
    })


    

  })
})
