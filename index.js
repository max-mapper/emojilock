var BLAKE2s = require('blake2s-js')
var Base58 = require('bs58')
var baseEmoji = require('base-emoji')

module.exports.encode = function (id) {
  var key = publicKeyFromId(id)
  var emoji = baseEmoji.toUnicode(key)
  return emoji
}

module.exports.decode = function (emoji) {
  var bytes = baseEmoji.fromUnicode(emoji)
  return idFromPublicKey(bytes)
}

// adapted from minilock-cli code

function publicKeyFromId (id) {
  var decoded = Base58.decode(id)
  // The last byte is the checksum, slice it off
  return new Buffer(decoded.slice(0, 32))
}

function idFromPublicKey (publicKey) {
  var hash = new BLAKE2s(1)
  hash.update(publicKey)

  // The last byte is the checksum.
  var checksum = new Buffer([hash.digest()[0]])
  var fullBuf = Buffer.concat([publicKey, checksum])
  return Base58.encode(fullBuf)
}