// require('./../test-env')
// const env = path.join(__dirname, '../.env.test')
// const envConfig = dotenv.parse(fs.readFileSync(env))
// for (const k in envConfig) {
//   process.env[k] = envConfig[k]
// }

// console.log('envConfig', envConfig)

// @ts-ignore
import http from 'k6/http'
// @ts-ignore
import { sleep } from 'k6'

// console.log('__ENV.', __ENV.SUPABASE_URL)
export default function () {
  http.get(__ENV.SUPABASE_URL)

  sleep(1)
}
