#!/usr/bin/env node

const { signers, generators } = require('eth-signer')
const phrase = process.env.SEED
if (!phrase) {
  console.log('Please set the SEED environmental variable')
} else {
  const hdPrivKey = generators.Phrase.toHDPrivateKey(phrase)
  const signer = new signers.HDSigner(hdPrivKey)
  const address = signer.getAddress()
  console.log('Address is', address)
}
