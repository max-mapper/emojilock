var baseEmoji = require('base-emoji')
var minilock = require('minilock')
var through = require('through2')
var pumpify = require('pumpify')

module.exports.encode = encode
module.exports.decode = decode
module.exports.encrypt = encrypt
module.exports.decrypt = decrypt

function encode (id) {
  var key = minilock.publicKeyFromId(id)
  var emoji = baseEmoji.toUnicode(key)
  return emoji
}

function decode (emoji) {
  var bytes = baseEmoji.fromUnicode(emoji)
  return minilock.idFromPublicKey(bytes)
}

function encrypt (email, passphrase, toId, cb) {
  minilock.encryptStream(email, passphrase, decode(toId), function (err, stream) {
    if (err) return cb(err)
    cb(null, pumpify(
      stream,
      through(function (chunk, enc, cb) {
        cb(null, baseEmoji.toUnicode(chunk))
      })
    ))
  })
}

function decrypt (email, passphrase, cb) {
  minilock.decryptStream(email, passphrase, function (err, stream) {
    if (err) return cb(err)
    cb(null, pumpify(
      through(function (chunk, enc, cb) {
        cb(null, baseEmoji.fromUnicode(chunk.toString('utf8')))
      }),
      stream
    ))
  })
}
