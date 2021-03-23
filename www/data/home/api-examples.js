export default [
  {
    title: 'Create user',
    description: 'Sign up a new user in an example chat room',
    lang: 'js',
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
    title: 'Realtime subscriptions',
    description: 'Receive realtime messages in an example chat room',
    lang: 'js',
    code: `import { createClient } from '@supabase/supabase-js'
    
// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get notified of all new chat messages
const realtime = supabase
  .from('messages')
  .on('INSERT', message => {
    console.log('New message!', message)
  })
  .subscribe()
    `,
  },
  {
    title: 'Read a record',
    description: 'Get all public rooms and their messages',
    lang: 'js',
    code: `m '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Get public rooms and their messages
const publicRooms = await supabase
  .from('rooms')
  .select(\`
    name,
    messages ( text )
  \`)
  .eq('public', true)
    `,
  },
  {
    title: 'Create a record',
    description: 'Create a new chat room',
    lang: 'js',
    code: `import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a new chat room
const newRoom = await supabase
  .from('rooms')
  .insert({ name: 'Supabase Fan Club', public: true })
  `,
  },
  {
    title: 'Update a record',
    description: 'Update a user',
    lang: 'js',
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
