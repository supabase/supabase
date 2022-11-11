import { createClient } from '@supabase/supabase-js'
export type ConfUser = {
  id?: string
  email?: string
  ticketNumber?: number | null
  name?: string | null
  username?: string | null
  createdAt?: number | null
  golden?: boolean
}

const supabase =
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_SECRET &&
  process.env.EMAIL_TO_ID_SECRET
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_SECRET)
    : undefined

export async function getUserByUsername(username: string): Promise<ConfUser> {
  const { data } = await supabase!
    .from('users')
    .select('name, ticketNumber')
    .eq('username', username)
    .single()

  return data ?? {}
}

export async function getUserById(id: string): Promise<ConfUser> {
  const { data, error } = await supabase!
    .from('users')
    .select('name, username, createdAt')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)

  return data ?? {}
}

export async function createUser(id: string, email: string): Promise<ConfUser> {
  const { data, error } = await supabase!.from('users').insert({ id, email }).single()
  if (error) throw new Error(error.message)

  return data ?? {}
}

export async function getTicketNumberByUserId(id: string): Promise<string | null> {
  const { data } = await supabase!.from('users').select('ticketNumber').eq('id', id).single()

  return data?.ticketNumber!.toString() ?? null
}

export async function createGitHubUser(user: any): Promise<string> {
  const { data, error } = await supabase!
    .from('github_users')
    .insert({ userData: user })
    .select()
    .single()
  if (error) throw new Error(error.message)

  return data.id
}

export async function updateUserWithGitHubUser(id: string, token: string): Promise<ConfUser> {
  const { data } = await supabase!.from('github_users').select('userData').eq('id', token).single()
  const { login: username, name } = data?.userData
  if (!username) {
    throw new Error('Invalid or expired token')
  }

  const { error } = await supabase!.from('users').update({ username, name }).eq('id', id).single()
  if (error) console.log(error.message)

  return { username, name }
}
