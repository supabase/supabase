export const signup = `
const {
  body: { user },
} = await supabase.auth.signup(
  'someone@email.com',
  'password'
)
`.trim()

export const login = `
const {
  body: { user },
} = await supabase.auth.login(
  'someone@email.com',
  'password'
)
`.trim()

export const userData = `
const user = await supabase.auth.user()
`.trim()

export const logout = `
await supabase.auth.logout()
`.trim()

export const errorHandling = `
try {
  const res = await supabase
    .auth
    .login('someone@email.com', 'password')
} catch (error) {
    if (error.response === undefined) {
      // No response from server
    } else {
      const server_response = error.response
      // Here you can further process the response ..
    }

    if (error.status === undefined) {
      // No HTTP status code
    } else {
      const http_code = error.status
      // Further processing ..
    }
}
`.trim()

export const setAccessToken = `
supabase.auth.saveSession(
  access_token, // from callback URL
  refresh_token, // from callback URL
  Math.round(Date.now() / 1000) + expires_in, // current time + seconds from callback URL
  null // currentUser not present yet
)
`.trim()
