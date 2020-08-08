export const signup = `
const {
  body: { user },
} = await supabase.auth.signup(
  'someone@email.com',
  'fOdaPdyTpkpxJgDVIORt'
)
`.trim()

export const login = `
const {
  body: { user },
} = await supabase.auth.login(
  'someone@email.com',
  'fOdaPdyTpkpxJgDVIORt'
)
`.trim()

export const userData = `
const user = await supabase.auth.user()
`.trim()

export const logout = `
await supabase.auth.logout()
`.trim()
