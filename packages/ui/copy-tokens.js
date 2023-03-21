const branch = process.env.npm_config_branch || 'main'
const url = `https://raw.githubusercontent.com/MildTomato/supabase-design-tokens/${branch}/tokens.json`

console.log('branch to pull is:', branch)

const https = require('https')
const fs = require('fs')

https.get(url, (resp) => resp.pipe(fs.createWriteStream(`./tokens.json`)))
