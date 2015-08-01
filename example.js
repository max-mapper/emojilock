var emojilock = require('./')

var alice = {
  email: 'random@random.org',
  passphrase: 'art for male thin money press around tooth',
  minilock: 'Y1q5hGER4Ag1Q9E5ZMtQkip4riUUgwoy67APhvhBYhZEE'
}

var keyemoji = emojilock.encode(alice.minilock)

emojilock.encrypt(alice.email, alice.passphrase, keyemoji, function (err, encrypt) {
  if (err) return console.error(err)
  emojilock.decrypt(alice.email, alice.passphrase, function (err, decrypt) {
    if (err) return console.error(err)
    encrypt
      .pipe(decrypt)
      .pipe(process.stdout)
    encrypt.write('HEY BOB!')
    encrypt.end()
  })
})
