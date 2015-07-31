var minilock = require('./minilock.js')
var fs = require('fs')

minilock.encryptStream('test@test.de', 'happy careful but neighbour round develop therefore', '6dZ3gQinFhGH1FS7UwxU8Q29xNceBS78ZGdD7FwfKHC9g', function (err, encrypt) {
  if (err) return console.error(err)
  minilock.decryptStream('test@test.de', 'happy careful but neighbour round develop therefore', function (err, decrypt) {
    if (err) return console.error(err)
    fs.createReadStream('test.js')
      .pipe(encrypt)
      .pipe(decrypt)
      .pipe(process.stdout)
  })
})

