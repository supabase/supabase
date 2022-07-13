/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ConfUser } from '~/lib/launchweek/types'
import { createClient } from '@supabase/supabase-js'

const supabase =
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_SECRET &&
  process.env.EMAIL_TO_ID_SECRET
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_SECRET)
    : undefined

export async function getUserByUsername(username: string): Promise<ConfUser> {
  const { data } = await supabase!
    .from<ConfUser>('users')
    .select('name, ticketNumber')
    .eq('username', username)
    .single()

  return data ?? {}
}

export async function getUserById(id: string): Promise<ConfUser> {
  const { data, error } = await supabase!
    .from<ConfUser>('users')
    .select('name, username, createdAt')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)

  return data ?? {}
}

export async function createUser(id: string, email: string): Promise<ConfUser> {
  const { data, error } = await supabase!.from<ConfUser>('users').insert({ id, email }).single()
  if (error) throw new Error(error.message)

  return data ?? {}
}

export async function getTicketNumberByUserId(id: string): Promise<string | null> {
  const { data } = await supabase!
    .from<ConfUser>('users')
    .select('ticketNumber')
    .eq('id', id)
    .single()

  return data?.ticketNumber!.toString() ?? null
}

export async function createGitHubUser(user: any): Promise<string> {
  const { data, error } = await supabase!.from('github_users').insert({ userData: user }).single()
  if (error) throw new Error(error.message)

  return data.id
}

export async function updateUserWithGitHubUser(id: string, token: string): Promise<ConfUser> {
  const { data } = await supabase!.from('github_users').select('userData').eq('id', token).single()
  const { login: username, name } = data?.userData
  if (!username) {
    throw new Error('Invalid or expired token')
  }

  const { error } = await supabase!
    .from<ConfUser>('users')
    .update({ username, name })
    .eq('id', id)
    .single()
  if (error) console.log(error.message)

  return { username, name }
}
