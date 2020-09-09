import { auth, supabase } from "lib/Store"

export default async function (req, res) {
  try {
    const { email, password } = req.body

    const authBody = await auth.login(email, password)

    return res.status(200).json({ refresh_token: authBody.token.refresh_token })
  } catch (error) {
    console.error('error', error)
    res.status(error.status || 500).end(error.message)
  }
}