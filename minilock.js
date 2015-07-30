// adapted from minilock-cli code

var Base58 = require('bs58')
var BLAKE2s = require('blake2s-js')
var nacl = require('tweetnacl')
var naclStream = require('nacl-stream')
var scrypt = require('scrypt-async')
var zxcvbn = require('zxcvbn')
var debug = require('debug')('minilock')
var streams = require('stream')
var duplexify = require('duplexify')

module.exports.publicKeyFromId = publicKeyFromId
module.exports.idFromPublicKey = idFromPublicKey
module.exports.getScryptKey = getScryptKey
module.exports.getKeyPair = getKeyPair
module.exports.keyPairFromSecret = keyPairFromSecret
module.exports.validateKey = validateKey
module.exports.validateId = validateId
module.exports.generateId = generateId
module.exports.asciiArmor = asciiArmor
module.exports.makeHeader = makeHeader
module.exports.encryptChunk = encryptChunk
module.exports.decryptChunk = decryptChunk
module.exports.encryptStream = encryptStream

var ENCRYPTION_CHUNK_SIZE = 256 // used in encryptChunk

function publicKeyFromId (id) {
  // The last byte is the checksum, slice it off
  return new Uint8Array(Base58.decode(id).slice(0, 32))
}

function idFromPublicKey (publicKey) {
  var hash = new BLAKE2s(1)
  hash.update(publicKey)

  // The last byte is the checksum.
  var checksum = new Buffer([hash.digest()[0]])

  var fullBuf = Buffer.concat([new Buffer(publicKey), checksum])
  return Base58.encode(fullBuf)
}

function getScryptKey (key, salt, callback) {
  scrypt(key, salt, 17, 8, 32, 1000, function scryptCb (keyBytes) {
    callback(nacl.util.decodeBase64(keyBytes))
  }, 'base64')
}

function getKeyPair (key, salt, callback) {
  var keyHash = new BLAKE2s(32)
  keyHash.update(nacl.util.decodeUTF8(key))

  getScryptKey(keyHash.digest(), nacl.util.decodeUTF8(salt), function (keyBytes) {
    callback(nacl.box.keyPair.fromSecretKey(keyBytes))
  })
}

function keyPairFromSecret (secret) {
  return nacl.box.keyPair.fromSecretKey(publicKeyFromId(secret))
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
  // should be own module implementing: https://tools.ietf.org/html/rfc4880#section-6
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

function hex (data) {
  return new Buffer(data).toString('hex')
}

function makeHeader (ids, senderInfo, fileInfo) {
  var ephemeral = nacl.box.keyPair()
  var header = {
    version: 1,
    ephemeral: nacl.util.encodeBase64(ephemeral.publicKey),
    decryptInfo: {}
  }

  debug('Ephemeral public key is ' + hex(ephemeral.publicKey))
  debug('Ephemeral secret key is ' + hex(ephemeral.secretKey))

  ids.forEach(function (id, index) {
    debug('Adding recipient ' + id)

    var nonce = nacl.randomBytes(24)
    var publicKey = publicKeyFromId(id)

    debug('Using nonce ' + hex(nonce))

    var decryptInfo = {
      senderID: senderInfo.id,
      recipientID: id,
      fileInfo: fileInfo
    }

    decryptInfo.fileInfo = nacl.util.encodeBase64(nacl.box(
      nacl.util.decodeUTF8(JSON.stringify(decryptInfo.fileInfo)),
      nonce,
      publicKey,
      senderInfo.secretKey
    ))

    decryptInfo = nacl.util.encodeBase64(nacl.box(
      nacl.util.decodeUTF8(JSON.stringify(decryptInfo)),
      nonce,
      publicKey,
      ephemeral.secretKey
    ))

    header.decryptInfo[nacl.util.encodeBase64(nonce)] = decryptInfo
  })

  // TODO: Should the this be stringified here?
  return JSON.stringify(header)
}

function encryptChunk (chunk, encryptor, output, hash) {
  if (chunk && chunk.length > ENCRYPTION_CHUNK_SIZE) {
    // slice chunk
    for (var i = 0; i < chunk.length; i += ENCRYPTION_CHUNK_SIZE) {
      encryptChunk(chunk.slice(i, i + ENCRYPTION_CHUNK_SIZE),
        encryptor, output, hash)
    }
  } else {
    chunk = encryptor.encryptChunk(new Uint8Array(chunk || []), !chunk)

    debug('Encrypted chunk ' + hex(chunk))

    if (Array.isArray(output)) output.push(new Buffer(chunk))
    else output.write(new Buffer(chunk))

    if (hash) hash.update(chunk)
  }
}

function decryptChunk (chunk, decryptor, output, hash) {
  while (true) {
    var length = chunk.length >= 4 ? chunk.readUIntLE(0, 4, true) : 0

    if (chunk.length < 4 + 16 + length) break

    var encrypted = new Uint8Array(chunk.slice(0, 4 + 16 + length))
    var decrypted = decryptor.decryptChunk(encrypted, false)

    chunk = chunk.slice(4 + 16 + length)

    if (decrypted) {
      debug('Decrypted chunk ' + hex(decrypted))

      if (Array.isArray(output)) output.push(new Buffer(decrypted))
      else output.write(new Buffer(decrypted))
    }

    if (hash) hash.update(encrypted)
  }

  return chunk
}

function encryptStream (passphrase, email, toId, cb) {
  getKeyPair(passphrase, email, function (keyPair) {
    cb(null, encryptStreamWithKeyPair(keyPair, toId))
  })
}

// keypair from passphrase/email  getKeyPair(passphrase, email, cb)
function encryptStreamWithKeyPair (keyPair, toId) {
  var fromId = idFromPublicKey(keyPair.publicKey)
  debug('Our miniLock ID is ' + fromId)

  var senderInfo = {
    id: fromId,
    secretKey: keyPair.secretKey
  }

  var fileKey = nacl.randomBytes(32)
  var fileNonce = nacl.randomBytes(16)

  debug('Using file key ' + hex(fileKey))
  debug('Using file nonce ' + hex(fileNonce))

  var encryptor = naclStream.stream.createEncryptor(fileKey, fileNonce, ENCRYPTION_CHUNK_SIZE)

  var hash = new BLAKE2s(32)

  // This is where the encrypted chunks go.
  var encrypted = []

  var filenameBuffer = new Buffer(256).fill(0) // TODO: Add filename here

  encryptChunk(filenameBuffer, encryptor, encrypted, hash)

  var inputByteCount = 0

  var input = new streams.Writable()
  var output = new streams.PassThrough()

  input._write = function (chunk, enc, cb) {
    inputByteCount += chunk.length
    encryptChunk(chunk, encryptor, encrypted, hash)
    cb()
  }

  input.on('finish', function () {
    encryptChunk(null, encryptor, encrypted, hash)
    encryptor.clean()

    // This is the 32-byte BLAKE2 hash of all the ciphertext.
    var fileHash = hash.digest()
    debug('File hash is ' + hex(fileHash))

    var fileInfo = {
      fileKey: nacl.util.encodeBase64(fileKey),
      fileNonce: nacl.util.encodeBase64(fileNonce),
      fileHash: nacl.util.encodeBase64(fileHash)
    }

    // TODO: Include self, multiple recipients
    var header = makeHeader([toId], senderInfo, fileInfo)

    var headerLength = new Buffer(4)
    headerLength.writeUInt32LE(header.length)

    debug('Header length is ' + hex(headerLength))

    var outputHeader = Buffer.concat([
      // The file always begins with the magic bytes 0x6d696e694c6f636b.
      new Buffer('miniLock'), headerLength, new Buffer(header)
    ])
    output.write(outputHeader)

    encrypted.forEach(function (chunk) {
      output.write(chunk)
    })
  })

  return duplexify(input, output)
}
