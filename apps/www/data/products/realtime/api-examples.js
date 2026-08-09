export default [
  {
    lang: 'js',
    title: 'Database changes',
    description: '',
    code: `
  import { createClient } from '@supabase/supabase-js'

  const supabaseClient = createClient('URL', 'ANON')
  const channel = supabaseClient
    .channel('postgresChangesChannel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, payload => console.log(payload))
    .subscribe()










      `,
  },
  {
    lang: 'js',
    title: 'Presence',
    description: '',
    code: `
  import { createClient } from '@supabase/supabase-js'

  const supabaseClient = createClient('URL', 'ANON')
  const channel = supabaseClient.channel('presenceChannel', { configs: { presence: 'id123' } })

  channel
    .on('presence', { event: 'sync' }, () => console.log(channel.presenceState()))
    .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => console.log(key, currentPresences, newPresences))
    .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => console.log(key, currentPresences, leftPresences))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ user_name: 'user123' })
        channel.track({ user_name: 'user345' })
      }
    })





      `,
  },
  {
    lang: 'js',
    title: 'Broadcast',
    description: '',
    code: `
  import { createClient } from '@supabase/supabase-js'

  const supabaseClient = createClient('URL', 'ANON')
  const channel = supabaseClient.channel('broadcastChannel', { configs: { broadcast: { self: true, ack: true } } })

  channel
    .on('broadcast', { event: 'pos' }, payload => console.log(payload))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel
        .send({ type: 'broadcast', event: 'pos', payload: { x: 0, y: 0 }})
        .then(status => {
          if (status === 'ok') console.log('ok')
    
          // if ack is false then channel.send will always return 'ok'
          if (status === 'timed out') console.log('timed out')
        })
      }
    })

    


      `,
  },
]
