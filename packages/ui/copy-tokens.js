const branch = 'feat/new-components'
// using Math.random() in a param as GitHub caches raw content
const url = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens.json?v=${Math.random()}`

console.log('branch to pull is:', branch)

const https = require('https')
const fs = require('fs')

https.get(url, (resp) => resp.pipe(fs.createWriteStream(`./tokens.json`)))
