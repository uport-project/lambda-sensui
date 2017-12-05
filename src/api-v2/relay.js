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

  async handle(body) {
    if (!body) {
      throw {code: 400, message: 'no body'}
      return
    }
    if (!body.metaSignedTx) {
      throw {code: 400, message: 'metaSignedTx paramter missing'}
    }
    if (!body.blockchain) {
      throw {code: 400, message: 'blockchain paramter missing'}
    }
    if (!(await this.isMetaSignatureValid(body))) {
      throw {code: 403, message: 'Meta signature invalid'}
    }

    const signedRawTx = await this.signTx(body)
    const txHash = await this.ethereumMgr.sendRawTransaction(signedRawTx, body.blockchain)

    return txHash
  }

  async signTx({metaSignedTx, blockchain}) {
    let tx = new Transaction(Buffer.from(metaSignedTx, 'hex'))
    tx.nonce = await this.ethereumMgr.getNonce(this.signer.getAddress(), blockchain)
    // TODO - set correct gas Limit
    tx.gasLimit = 3000000
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

