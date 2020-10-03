// BUG:  https://github.com/pikapkg/snowpack/pull/444
// adding   "namedExports": ["@supabase/supabase-js"], to snowPack config doesn't work
// import {createClient} from '@supabase/supabase-js'
import Supabase from '@supabase/supabase-js'
const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = import.meta.env

const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
export const getLists = async () => {
  const { body } = await supabase
    .from(`lists`)
    // .on('INSERT', (payload) => handleNewTask(payload.new))
    // .on('UPDATE', (payload) => handleNewTask(payload.new))
    .select('uuid,id')
  return body
}

export const getItems = async (list) => {
  const { body } = await supabase
    .from(`tasks:list_id=eq.${list.id}`)
    // .on('INSERT', (payload) => handleNewTask(payload.new))
    // .on('UPDATE', (payload) => handleNewTask(payload.new))
    .select('*')
  return body
}
export const itemsAllAtOnce = async () => {
  const { body } = await supabase.from('lists').select(`
      id, inserted_at, updated_at,
      tasks (id, task_text, complete, inserted_at, updated_at)
  `)
  return body || []
}

export const items = () => {
  try {
    return itemsAllAtOnce()
  } catch (err) {
    console.error(err)
    return []
  }
}
