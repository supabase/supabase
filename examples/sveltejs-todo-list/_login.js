require('dotenv').config()
const Supabase = require('@supabase/supabase-js')
const {
  SNOWPACK_PUBLIC_SUPABASE_URL,
  SNOWPACK_PUBLIC_SUPABASE_KEY,
  SNOWPACK_PUBLIC_USER,
  SNOWPACK_PUBLIC_PASSWORD,
} = process.env
const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
async function login() {
  try {
    const res = await supabase.auth.signIn({
      email: SNOWPACK_PUBLIC_USER,
      password: SNOWPACK_PUBLIC_PASSWORD,
    })
    console.log({ res })
    return res
  } catch (error) {
    console.error({ error })
    if (error.response === undefined) {
      // No response from server
    } else {
      const server_response = error.response
      // Here you can further process the response ..
    }

    if (error.status === undefined) {
      // No HTTP status code
    } else {
      const http_code = error.status
      // Further processing ..
    }
  }
  return null
}
login()
module.exports = {
  login,
}
