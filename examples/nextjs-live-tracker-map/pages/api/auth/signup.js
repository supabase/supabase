import { supabase, auth } from "lib/Store"

export default async function (req, res) {
  try {
    const { email, password, role } = req.body

    const authBody = await auth.signUp({email, password})

    supabase.setAccessToken(authBody.data.access_token)
    const { data: user } = await supabase.from('users').insert([{ id: authBody.user.id, username: email, role }]).single()

    return res.status(200).json({ ...user, refresh_token: authBody.refresh_token })
  } catch (error) {
    console.error('error', error)
    res.status(error.status || 500).end(error.message)
  }
}