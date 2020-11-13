const Supabase = require('@supabase/supabase-js')
require('dotenv').config()
const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = process.env
//import.meta.env
module.exports = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
