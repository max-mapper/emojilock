#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var emojilock = require('./')
var id = process.argv[2]

if (id) {
  console.log(emojilock.encode(id))
  process.exit(0)
}

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
