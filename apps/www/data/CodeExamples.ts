interface Code {
  javascript: string
}

export interface ExampleProps {
  id: string
  name: string
  description: string
  code: Code
}

export const createUserExample: ExampleProps = {
  id: 'createUserExample',
  name: 'Create user',
  description: 'Sign up a new user in an example chat room',
  code: {
    javascript: `
  import { createClient } from '@supabase/supabase-js'
  
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
}

export const subscribeExample: ExampleProps = {
  id: 'subscribeExample',
  name: 'Realtime subscriptions',
  description: 'Receive realtime messages in an example chat room',
  code: {
    javascript: `
  import { createClient } from '@supabase/supabase-js'
  
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
}

export const readExample: ExampleProps = {
  id: 'readExample',
  name: 'Read a record',
  description: 'Get all public rooms and their messages',
  code: {
    javascript: `
  import { createClient } from '@supabase/supabase-js'
  
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
}

export const createExample: ExampleProps = {
  id: 'createExample',
  name: 'Create a record',
  description: 'Create a new chat room',
  code: {
    javascript: `
  import { createClient } from '@supabase/supabase-js'
  
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
}

export const updateExample: ExampleProps = {
  id: 'updateExample',
  name: 'Update a record',
  description: 'Update a user',
  code: {
    javascript: `
  import { createClient } from '@supabase/supabase-js'
  
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
}

// const heroExample = `
//   const messages = supabase
//     .from('messages')
//     .select(\`
//       id, text,
//       user ( id, name )
//     \`)

//   const newMessages = supabase
//     .from('messages')
//     .on('INSERT', message => console.log('New message!', message) )
//     .subscribe()
//   `
// const subscribeExample = `
//   import { createClient } from '@supabase/supabase-js'

//   // Initialize
//   const supabaseUrl = 'https://chat-room.supabase.co'
//   const supabaseKey = 'public-anon-key'
//   const supabase = createClient(supabaseUrl, supabaseKey)

//   // Get notified of all new chat messages
//   const realtime = supabase
//     .from('messages')
//     .on('INSERT', message => {
//       console.log('New message!', message)
//     })
//     .subscribe()
//   `
// const readExample = `
//   import { createClient } from '@supabase/supabase-js'

//   // Initialize
//   const supabaseUrl = 'https://chat-room.supabase.co'
//   const supabaseKey = 'public-anon-key'
//   const supabase = createClient(supabaseUrl, supabaseKey)

//   // Get public rooms and their messages
//   const publicRooms = await supabase
//     .from('rooms')
//     .select(\`
//       name,
//       messages ( text )
//     \`)
//     .eq('public', true)
//   `
// const createExample = `
//   import { createClient } from '@supabase/supabase-js'

//   // Initialize
//   const supabaseUrl = 'https://chat-room.supabase.co'
//   const supabaseKey = 'public-anon-key'
//   const supabase = createClient(supabaseUrl, supabaseKey)

//   // Create a new chat room
//   const newRoom = await supabase
//     .from('rooms')
//     .insert({ name: 'Supabase Fan Club', public: true })
//   `
// const updateExample = `
//   import { createClient } from '@supabase/supabase-js'

//   // Initialize
//   const supabaseUrl = 'https://chat-room.supabase.co'
//   const supabaseKey = 'public-anon-key'
//   const supabase = createClient(supabaseUrl, supabaseKey)

//   // Update multiple users
//   const updatedUsers = await supabase
//     .from('users')
//     .eq('account_type', 'paid')
//     .update({ highlight_color: 'gold' })
//   `
// const nodeTSExample = `
//   import { NextApiRequest, NextApiResponse } from 'next';
//   import { createClient } from '@supabase/supabase-js';

//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SECRET_KEY
//   );

//   type User = {
//     id: string;
//     username: string;
//     status: 'ONLINE' | 'OFFLINE';
//   };

//   export default async (req: NextApiRequest, res: NextApiResponse) => {
//     const allOnlineUsers = await supabase
//       .from<User>('users')
//       .select('*')
//       .eq('status', 'ONLINE');
//     res.status(200).json(allOnlineUsers);
//   };
//   `

// const umdExample = `
//   <script src="https://unpkg.com/@supabase/supabase-js/umd/supabase.js"></script>

//   <script>
//     // Initialize
//     const supabaseUrl = 'https://chat-room.supabase.co'
//     const supabaseKey = 'public-anon-key'
//     const supabase = Supabase.createClient(supabaseUrl, supabaseKey)

//     // Get public rooms and their messages
//     supabase
//       .from('rooms')
//       .select(\`
//         name,
//         messages ( text )
//       \`)
//       .eq('public', true)
//       .then(response => {
//         // Do something with the response
//       })
//   </script>
//   `
