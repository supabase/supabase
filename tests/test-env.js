const fs = require('fs')
const path = require('path')


const env = path.join(__dirname, '.env.test')
require('dotenv').config({ path: env })

