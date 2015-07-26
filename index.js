var Base48 = require('bs58')
var baseEmoji = require('base-emoji')

module.exports.encode = function (id) {
  return baseEmoji.toUtf8(new Buffer(Base58.decode(id).slice(0, 32)))
}

module.exports.decode = function (str) {
  // todo
}