import { createClient, User, UserResponse } from '@supabase/supabase-js'

const removeAllUsers = async () => {
  const sb = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_KEY_ADMIN as string
  )

  const {
    data: { users },
  } = await sb.auth.admin.listUsers()

  const promises: Promise<UserResponse>[] = []
  users.map((u) => {
    sb.from('profiles')
      .delete()
      .match({ id: u.id })
      .then(() => promises.push(sb.auth.admin.deleteUser(u.id)))
  })
  await Promise.all(promises)
}

export default async () => {
  await removeAllUsers()
}
