require('dotenv').config()
const Supabase = require('@supabase/supabase-js')
const {
  SNOWPACK_PUBLIC_SUPABASE_URL,
  SNOWPACK_PUBLIC_SUPABASE_KEY,
  SNOWPACK_PUBLIC_USER,
  SNOWPACK_PUBLIC_PASSWORD,
} = process.env
// const [SNOWPACK_PUBLIC_SUPABASE_URL,SNOWPACK_PUBLIC_SUPABASE_KEY] =
const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
;(async () => {
  let { data, user, error } = await supabase.auth.signUp({
    email: SNOWPACK_PUBLIC_USER,
    password: SNOWPACK_PUBLIC_PASSWORD,
  })
  console.log({ data, user, error })
})()
