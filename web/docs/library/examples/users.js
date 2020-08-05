export const signup = `
let { body: user } = await supabase
  .auth
  .signup({ 
    email: 'someone@email.com', 
    password: 'fOdaPdyTpkpxJgDVIORt' 
  })
`.trim()

export const login = `
let { body: user } = await supabase
  .auth
  .login({ 
    email: 'someone@email.com', 
    password: 'fOdaPdyTpkpxJgDVIORt' 
  })
`.trim()

export const userData = `
let { bod: user } = await supabase
  .auth
  .user()
`.trim()

export const logout = `
let { body: loggedOut } = await supabase
  .auth
  .logout()
`.trim()
