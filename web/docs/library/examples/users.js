export const signup = `
let { body: user } = await supabase
  .auth
  .signup( 
    'someone@email.com', 
    'fOdaPdyTpkpxJgDVIORt' 
  )
`.trim()

export const login = `
let { body: user } = await supabase
  .auth
  .login( 
    'someone@email.com', 
    'fOdaPdyTpkpxJgDVIORt' 
  )
`.trim()

export const userData = `
let { body: user } = await supabase
  .auth
  .user()
`.trim()

export const logout = `
let { body: loggedOut } = await supabase
  .auth
  .logout()
`.trim()
