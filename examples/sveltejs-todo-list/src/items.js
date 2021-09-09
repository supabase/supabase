// BUG:  https://github.com/pikapkg/snowpack/pull/444
// adding   "namedExports": ["@supabase/supabase-js"], to snowPack config doesn't work
import { createClient } from '@supabase/supabase-js'
// import { Socket } = '@supabase/realtime-js'

// var socket = new Socket(process.env.REALTIME_URL)
// socket.connect()

let importEnv = true
try {
  if (process.env.NODE_ENV === 'test') importEnv = false
} catch (error) {}

const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = !importEnv
  ? process.env
  : import.meta.env

const supabase = createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
export const getLists = async () => {
  const { body } = await supabase
    .from(`lists`)
    // .on('INSERT', (payload) => handleNewTask(payload.new))
    // .on('UPDATE', (payload) => handleNewTask(payload.new))
    .select('name,id')
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
      id, name, inserted_at,
      tasks (id, task_text, complete, inserted_at)
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
// https://supabase.io/docs/library/subscribe/
// TODO docs #179
export const subscription = () => {
  return supabase
    .from(
      `lists(id, name, inserted_at,
    tasks (id, task_text, complete, inserted_at)`
    )
    .on('*', (payload) => {
      console.log({ payload })
    })
    .subscribe()
}
// var allChanges = this.socket.channel('realtime:public:users:id.eq.99')
//   .join()
//   .on('*', payload => { console.log('Update received!', payload) })
