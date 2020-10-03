import Supabase from '@supabase/supabase-js'
const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = import.meta.env

const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
export const fetchUsers = async () => {
  const { body } = await supabase.from('users').select(`
      *
  `)
  return body || []
}
