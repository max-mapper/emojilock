var minilock = require('./minilock.js')

minilock.encryptStream('test@test.de', 'happy careful but neighbour round develop therefore', '7bPDm78gWuuWFPdtpYJ3SXVFP9XHQoqWFfAwFcVs5CE2S', function (err, stream) {
  if (err) console.error(err)
  process.stdin.pipe(stream).pipe(process.stdout)
})
