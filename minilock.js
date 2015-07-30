// adapted from minilock-cli code

var Base58 = require('bs58')
var BLAKE2s = require('blake2s-js')
var nacl = require('tweetnacl')
var naclStream = require('nacl-stream')
var scrypt = require('scrypt-async')
var zxcvbn = require('zxcvbn')

module.exports.publicKeyFromId = publicKeyFromId
module.exports.idFromPublicKey = idFromPublicKey
module.exports.getScryptKey = getScryptKey
module.exports.getKeyPair = getKeyPair
module.exports.keyPairFromSecret = keyPairFromSecret
module.exports.validateKey = validateKey
module.exports.validateId = validateId
module.exports.generateId = generateId
module.exports.asciiArmor = asciiArmor

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

function getScryptKey (key, salt, callback) {
  scrypt(key, salt, 17, 8, 32, 1000, function scryptCb (keyBytes) {
    return callback(nacl.util.decodeBase64(keyBytes))
  }, 'base64')
}

function getKeyPair (key, salt, callback) {
  var keyHash = new BLAKE2s(32)
  keyHash.update(nacl.util.decodeUTF8(key))

  getScryptKey(keyHash.digest(), nacl.util.decodeUTF8(salt), function(keyBytes) {
    callback(nacl.box.keyPair.fromSecretKey(keyBytes))
  })
}

function keyPairFromSecret (secret) {
  return nacl.box.keyPair.fromSecretKey(keyFromId(secret))
}

function validateKey (key) {
  var keyRegex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
  if (!key) return false
  if (!(key.length >= 40 && key.length <= 50)) return false
  if (!keyRegex.test(key)) return false

  return nacl.util.decodeBase64(key).length === 32
}

function validateId (id) {
  var idRegex = /^[1-9ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{40,55}$/
  if (!idRegex.test(id)) return false

  var bytes = Base58.decode(id)
  if (bytes.length !== 33) return false

  var hash = new BLAKE2s(1)
  hash.update(bytes.slice(0, 32))

  return hash.digest()[0] === bytes[32]
}

function generateId (email, passphrase, callback) {
  getKeyPair(passphrase, email, function (keyPair) {
    callback(null, idFromPublicKey(keyPair.publicKey), keyPair)
  })
}

function asciiArmor (data, indent) {
  var ARMOR_WIDTH = 64
  var ascii = new Buffer(data).toString('base64')

  var lines = []

  if ((indent = Math.max(0, indent | 0)) > 0) {
    // Indent first line.
    lines.push(ascii.slice(0, ARMOR_WIDTH - indent))

    ascii = ascii.slice(ARMOR_WIDTH - indent)
  }

  while (ascii.length > 0) {
    lines.push(ascii.slice(0, ARMOR_WIDTH))

    ascii = ascii.slice(ARMOR_WIDTH)
  }

  return lines.join('\n')
}
