#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var emojilock = require('./')
var id = process.argv[2]

if (!id) {
  tryProfile()
} else if (id === 'decode') {
  console.log(emojilock.decode(process.argv[3]))
  process.exit(0)
} else {
  console.log(emojilock.encode(id))
  process.exit(0)
}

function tryProfile() {
  var minilockPath = path.join(process.env.HOME || process.env.USERPROFILE, '.mlck', 'profile.json')
  fs.readFile(minilockPath, function (err, buf) {
    if (err) {
      console.error('Could not find minilock-cli profile')
      process.exit(1)
    }
    var profile = JSON.parse(buf)
    console.log(emojilock.encode(profile.id))
    process.exit(0)
  })
}
