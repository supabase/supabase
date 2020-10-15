export const signUp = `
const { error, user } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: 'password'
})
`.trim()

export const signIn = `
const { error, user } = await supabase.auth.signIn({
  email: 'someone@email.com',
  password: 'password'
})
`.trim()

export const userData = `
const { error, data } = await auth.user()
`.trim()

export const signOut = `
await supabase.auth.signOut()
`.trim()

export const update = `
const { error, data } = await auth.update({ 
  data: { hello: 'world' } 
})
`.trim()

export const signInOauth = `
const { error, user } = await supabase.auth.signIn({
  // provider can be 'github', 'google', 'gitlab', or 'bitbucket'
  provider: 'github'
})
`.trim()

export const onAuthStateChange = `
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
})
`.trim()