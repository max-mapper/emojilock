var fs = require('fs')
var pluralize = require('pluralize')

var commonWords = JSON.parse(fs.readFileSync('english.json'))
var emoji = JSON.parse(fs.readFileSync('emoji.json'))

var ranked = []

Object.keys(emoji).forEach(function (k) {

  // get common english word index
  var ranks = []
  emoji[k].keywords.push(k) // include name
  emoji[k].keywords.forEach(function (kw) {
    if (kw === 'custom_') return
    var words = kw.replace('_', ' ').replace('-', ' ').split(' ')
    words.forEach(function (w) {
      var sw = pluralize.singular(w)
      var idx = commonWords.indexOf(sw)
      if (idx === -1) return
      ranks.push(idx)      
    })
  })
  
  // average
  var rank = 0
  ranks.forEach(function (r) {
    rank += r
  })
  rank = rank / ranks.length

  if (isNaN(rank)) return  
  ranked.push({char: emoji[k].char, name: k, rank: rank})
})

ranked = ranked.sort(function (a, b) { return a.rank - b.rank }).map(function (em) { return em.char })
console.log(ranked.join(''))