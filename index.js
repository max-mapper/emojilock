var baseEmoji = require('base-emoji')
var minilock = require('./minilock.js')

module.exports.encode = function (id) {
  var key = minilock.publicKeyFromId(id)
  var emoji = baseEmoji.toUnicode(key)
  return emoji
}

module.exports.decode = function (emoji) {
  var bytes = baseEmoji.fromUnicode(emoji)
  return minilock.idFromPublicKey(bytes)
}

