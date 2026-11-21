// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2'

interface Task {
  name: string
  status: number
}

async function getTask(supabaseClient: SupabaseClient, id: string) {
  const { data: task, error } = await supabaseClient.from('tasks').select('*').eq('id', id)
  if (error) throw new Error(error.message)

  return Response.json({ task })
}

async function getAllTasks(supabaseClient: SupabaseClient) {
  const { data: tasks, error } = await supabaseClient.from('tasks').select('*')
  if (error) throw new Error(error.message)

  return Response.json({ tasks })
}

async function deleteTask(supabaseClient: SupabaseClient, id: string) {
  const { error } = await supabaseClient.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)

  return Response.json({})
}

async function updateTask(supabaseClient: SupabaseClient, id: string, task: Task) {
  const { error } = await supabaseClient.from('tasks').update(task).eq('id', id)
  if (error) throw new Error(error.message)

  return Response.json({ task })
}

async function createTask(supabaseClient: SupabaseClient, task: Task) {
  const { error } = await supabaseClient.from('tasks').insert(task)
  if (error) throw new Error(error.message)

  return Response.json({ task })
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { url, method } = req

    try {
      // ctx.supabase is scoped to the calling user, so your row-level-security
      // (RLS) policies are applied.
      const supabaseClient = ctx.supabase

      // For more details on URLPattern, check https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
      const taskPattern = new URLPattern({ pathname: '/restful-tasks/:id' })
      const matchingPath = taskPattern.exec(url)
      const id = matchingPath ? matchingPath.pathname.groups.id : null

      let task = null
      if (method === 'POST' || method === 'PUT') {
        const body = await req.json()
        task = body.task
      }

      // call relevant method based on method and id
      switch (true) {
        case id && method === 'GET':
          return await getTask(supabaseClient, id as string)
        case id && method === 'PUT':
          return await updateTask(supabaseClient, id as string, task)
        case id && method === 'DELETE':
          return await deleteTask(supabaseClient, id as string)
        case method === 'POST':
          return await createTask(supabaseClient, task)
        case method === 'GET':
          return await getAllTasks(supabaseClient)
        default:
          return await getAllTasks(supabaseClient)
      }
    } catch (error) {
      console.error(error)

      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      )
    }
  }),
}
