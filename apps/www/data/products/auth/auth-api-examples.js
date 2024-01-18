export default [
  {
    lang: 'js',
    title: 'Sign up',
    description: '',
    code: `
  // Sign up with email
  const { user, error } = await supabase.auth.signUp({
    email: 'example@email.com',
    password: 'example-password',
  })













      `,
  },
  {
    lang: 'js',
    title: 'Sign in',
    description: '',
    code: `
  // Sign in with email
  const { user, error } = await supabase.auth.signIn({
    email: 'example@email.com',
    password: 'example-password',
  })












      `,
  },
  {
    lang: 'js',
    title: 'Magic Links',
    description: '',
    code: `
  // Sign in with magic links
  const { user, error } = await supabase.auth.signIn({
    email: 'example@email.com'
  })





  








      `,
  },
  {
    lang: 'js',
    title: 'OAuth logins',
    description: '',
    code: `
  // Sign in with GitHub
  // And request extra permissions!
  const { user, error } = await supabase.auth.signIn({
    provider: 'github',
  }, {
    scopes: 'repo gist notifications'
  })












      `,
  },
]
