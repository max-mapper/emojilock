var Base58 = require('bs58')
var BLAKE2s = require('blake2s-js')

// adapted from minilock-cli code

module.exports.publicKeyFromId = function (id) {
  var decoded = Base58.decode(id)
  // The last byte is the checksum, slice it off
  return new Buffer(decoded.slice(0, 32))
}

module.exports.idFromPublicKey = function (publicKey) {
  var hash = new BLAKE2s(1)
  hash.update(publicKey)

  // The last byte is the checksum.
  var checksum = new Buffer([hash.digest()[0]])
  var fullBuf = Buffer.concat([publicKey, checksum])
  return Base58.encode(fullBuf)
}
