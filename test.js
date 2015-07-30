var test = require('tape')
var emojilock = require('./')

var id = "25DAuXM9z84c4iEXazuvwtBX2651pLa4xp5bF2p3pJqKMw" // my minilock id
var keyemoji = "📍🌍💩👼💊🍃🍷🍃🐊👅⛄️🎵🔋👊🐫🍁🐜🎂🐇🐣🐾👛📚👇🍟🐝🎲😭🎈🎊🙏🐜"

test('encode', function (t) {
  var encoded = emojilock.encode(id)
  t.equal(encoded, keyemoji, keyemoji)
  t.end()
})

test('decode', function (t) {
  t.equal(emojilock.decode(keyemoji).toString('hex'), id.toString('hex'), id)
  t.end()
})
