import ErrnoException = NodeJS.ErrnoException

const { writeFile } = require('fs')

// Configure Angular `environment.ts` file path
const targetPath = './src/environments/environment.prod.ts'

// read environment variables from .env file
require('dotenv').config()

// `environment.ts` file structure
const envConfigFile = `export const environment = {
   production: true,
   supabaseUrl: '${process.env.ANGULAR_APP_SUPABASE_URL}',
   supabaseKey: '${process.env.ANGULAR_APP_SUPABASE_KEY}'
  };
`

writeFile(targetPath, envConfigFile, function (err: ErrnoException | null) {
  if (err) {
    throw console.error(err)
  }
})
