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
