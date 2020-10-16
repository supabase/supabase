/**
 * subscribe.mdx examples
 */

export const subscribeAllJs = `
const mySubscription = supabase
  .from('*')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeTableJs = `
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeInsertsJs = `
const mySubscription = supabase
  .from('countries')
  .on('INSERT', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeUpdatesJs = `
const mySubscription = supabase
  .from('countries')
  .on('UPDATE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeDeletesJs = `
const mySubscription = supabase
  .from('countries')
  .on('DELETE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`.trim()

export const subscribeMultipleJs = `
const mySubscription = supabase
  .from('countries')
  .on('INSERT', handleRecordInserted)
  .on('DELETE', handleRecordDeleted)
  .subscribe()
`.trim()

export const subscribeRowJs = `
const mySubscription = supabase
  .from('countries:id.eq.200')
  .on('UPDATE', handleRecordUpdated)
  .subscribe()
`.trim()

export const subscribeUnsubscribeJs = `
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
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Disconnect mySubscription
let { error, data } = await supabase.removeSubscription(mySubscription)
let { openSubscriptions } = data
`.trim()
