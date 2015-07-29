var emoji = require('base-emoji')
var data = new Buffer('d16ac00bb78efb8e59efdfa1206c43940e28c683afc432ba742276e01853c30e', 'hex')
var data = new Buffer('deadbeef', 'hex')

var encoded = emoji.toUnicode(data)
console.log(encoded)
// outputs: 😢🌉🚧✈️🍸🍫🌾🍫💙🐬💨🕑⬅️💔🐻🌆🚑↖️©🐈🕘🆒🍼💥👥↘️🍰📅◀️⬛️🍪🚑

var decoded = emoji.fromUnicode(encoded)
console.log(decoded.toString('hex') === data.toString('hex'))
// outputs: false
