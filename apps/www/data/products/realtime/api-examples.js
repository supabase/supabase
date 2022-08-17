export default [
  {
    lang: 'js',
    title: 'Subscribing to events',
    description: '',
    code: `
import { RealtimeClient } from '@supabase/realtime-js'
const client = new RealtimeClient(process.env.REALTIME_URL)

// Listen to events on the entire database.
const databaseChanges = client.channel('realtime:*')
databaseChanges.on('*', (e) => console.log(e))
databaseChanges.subscribe()















      `,
  },
  {
    lang: 'js',
    title: 'Presence',
    description: '',
    code: `
import { RealtimeClient } from '@supabase/realtime-js'
const client = new RealtimeClient(process.env.REALTIME_URL)

const channel = client.channel('room:*')
channel.on('presence', { event: 'SYNC' }, () => {
  console.log('Presence synced')
})
channel.subscribe().receive('ok', () => console.log('Subscribed!))












      `,
  },
  {
    lang: 'js',
    title: 'Broadcast',
    description: '',
    code: `
  // Sign in with magic links
  const { user, error } = await supabase.auth.signIn({
    email: 'example@email.com'
  })





  








      `,
  },
]
