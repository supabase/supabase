// BUG:  https://github.com/pikapkg/snowpack/pull/444
// adding   "namedExports": ["@supabase/supabase-js"], to snowPack config doesn't work
// import {createClient} from '@supabase/supabase-js'
import Supabase from '@supabase/supabase-js'
const {SNOWPACK_PUBLIC_SUPABASE_URL,SNOWPACK_PUBLIC_SUPABASE_KEY} =import.meta.env

const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)

export const itemsAllAtOnce = async () => {
  const { body } = await supabase.from('lists').select(`
      id, inserted_at, updated_at,
      tasks (id, task_text, complete, user_id, inserted_at, updated_at)
  `)
  return body
}

export const items = () => {
  try {
    return JSON.parse(localStorage.getItem('todos-svelte')) || []
  } catch (err) {
    return []
  }
}
