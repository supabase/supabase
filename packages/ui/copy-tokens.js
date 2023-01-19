const url = 'https://raw.githubusercontent.com/MildTomato/figma-tokens-supabase/main/tokens.json'

const https = require('https')
const fs = require('fs')

https.get(url, (resp) => resp.pipe(fs.createWriteStream(`./tokens.json`)))
