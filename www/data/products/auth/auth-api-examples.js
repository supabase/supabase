export default [
  {
    lang: 'js',
    title: 'Create user',
    description: 'Sign up a new user in an example chat room',
    code: `import { createClient } from '@supabase/supabase-js'
      
  // Initialize 
  const supabaseUrl = 'https://chat-room.supabase.co'
  const supabaseKey = 'public-anon-key'
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Create a new user
  const { user, error } = await supabase.auth.signUp({
    email: 'example@email.com',
    password: 'example-password',
  })
      `,
  },
  {
    lang: 'js',
    title: 'Update a user',
    description: 'Update a user',
    code: `import { createClient } from '@supabase/supabase-js'
      
  // Initialize 
  const supabaseUrl = 'https://chat-room.supabase.co'
  const supabaseKey = 'public-anon-key'
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Update multiple users
  const updatedUsers = await supabase
    .from('users')
    .eq('account_type', 'paid')
    .update({ highlight_color: 'gold' })
  `,
  },
]
