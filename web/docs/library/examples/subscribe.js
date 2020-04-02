/**
 * subscribe.mdx examples
 */

export const subscribeAllJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('*')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeTableJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeInsertsJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('INSERT', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeUpdatesJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('UPDATE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeDeletesJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('DELETE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeMultipleJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('INSERT', handleRecordInserted)
  .on('DELETE', handleRecordDeleted)
  .subscribe()
`.trim()

export const subscribeUnsubscribeJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Unsubscribe from changes
mySubscription.unsubscribe()
`.trim()

export const subscribeRemoveJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Disconnect mySubscription
supabase.removeSubscription(mySubscription)
`.trim()
