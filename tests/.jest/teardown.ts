import { ApiError, createClient, User } from '@supabase/supabase-js'

const removeAllUsers = async () => {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)

  const { data: users } = await sb.auth.api.listUsers()

  const promises: Promise<{
    user: User
    data: User
    error: ApiError
  }>[] = []
  users.map((u) => {
    sb.from('profiles')
      .delete()
      .match({ id: u.id })
      .then(() => promises.push(sb.auth.api.deleteUser(u.id)))
  })
  await Promise.all(promises)
}

export default async () => {
  await removeAllUsers()
}
