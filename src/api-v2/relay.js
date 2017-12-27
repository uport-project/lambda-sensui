import { signers, generators } from 'eth-signer'
import Transaction from 'ethereumjs-tx'

const TxRelaySigner = signers.TxRelaySigner
const HDSigner = signers.HDSigner

class RelayHandler {
  constructor (ethereumMgr, phrase) {
    this.ethereumMgr = ethereumMgr

    const hdPrivKey = generators.Phrase.toHDPrivateKey(phrase)
    this.signer = new HDSigner(hdPrivKey)
  }

  async handle(event, context, cb) {
    if (!event) {
      cb({code: 400, message: 'no json body'})
      return;
    }
    if (!event.metaSignedTx) {
      cb ({code: 400, message: 'metaSignedTx paramter missing'})
      return;
    }
    if (!event.blockchain) {
      cb ({code: 400, message: 'blockchain paramter missing'})
      return;
    }
    if (!(await this.isMetaSignatureValid(event))) {
      cb({code: 403, message: 'Meta signature invalid'})
      return;
    }

    try{
      const signedRawTx = await this.signTx(event)
      const txHash = await this.ethereumMgr.sendRawTransaction(signedRawTx, event.blockchain)
      cb(null, txHash)
    } catch(err) {
      console.log("Error on this.ethereumMgr.sendRawTransaction")
      console.log(err)
      cb({ code: 500, message: err.message })
      return;
    }

  }

  async signTx({metaSignedTx, blockchain}) {
    let tx = new Transaction(Buffer.from(metaSignedTx, 'hex'))
    tx.nonce = await this.ethereumMgr.getNonce(this.signer.getAddress(), blockchain)
    // TODO - set correct gas Limit
    tx.gasLimit = 3000000
    tx.gasPrice = await this.ethereumMgr.getGasPrice(blockchain)
    const rawTx = tx.serialize().toString('hex')
    return new Promise((resolve, reject) => {
      this.signer.signRawTx(rawTx, (error, signedRawTx) => {
        if (error) {
          reject(error)
        }
        resolve(signedRawTx)
      })
    })
  }

  async isMetaSignatureValid({metaSignedTx, blockchain}) {
    const decodedTx = TxRelaySigner.decodeMetaTx(metaSignedTx)
    const relayAddress = await this.ethereumMgr.getRelayAddress(blockchain)
    const nonce = await this.ethereumMgr.getRelayNonce(decodedTx.claimedAddress, blockchain)
    const validMetaSig = TxRelaySigner.isMetaSignatureValid(relayAddress, decodedTx, nonce)
    return validMetaSig
  }

}

module.exports = RelayHandler

