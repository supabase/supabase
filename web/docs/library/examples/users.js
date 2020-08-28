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

export const requestRecoveryTokenEmail = `
axios.post(
  'https://<your-ref>.supabase.co/auth/v1/recover',
  {
    email : '<the-users-email>'
  },
  {
    headers : [
      'Content-Type': 'application/json',
      'apikey': '<your-supabase-api-key>' 
    ]
  })
  .then(console.log)
  .catch(console.error)
`.trim()

export const verifyRecoveryToken = `
axios.post(
  'https://<your-ref>.supabase.co/auth/v1/verify',
  {
    type : 'recovery',
    token : '<the-recovery-token>'
  },
  {
    headers : [
      'Content-Type': 'application/json',
      'apikey': '<your-supabase-api-key>' 
    ]
  })
  .then(res => {
    console.log(res.data)
  })
  .catch(console.error)
`.trim()

export const updateUser = `
axios.put(
  'https://<your-ref>.supabase.co/auth/v1/user',
  {
    password : '<some-new-password>'
  },
  {
    headers : [
      'Content-Type': 'application/json',
      'apikey': '<your-supabase-api-key>',
      'Authorization': 'Bearer <users-access-token>' 
    ]
  })
  .then(console.log)
  .catch(console.error)
`.trim()
