import { createClient } from '@supabase/supabase-js'

let importEnv = true
try {
  if (process.env.NODE_ENV === 'test') importEnv = false
} catch (error) {}

const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = !importEnv
  ? process.env
  : import.meta.env

const supabase = createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
export const fetchUsers = async () => {
  const { body } = await supabase.from('users').select(`
      *
  `)
  return body || []
}
