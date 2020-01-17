import { uuid } from './utils/Helpers'
import Base from './Base'

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey, options = {}) {
    this.supabaseUrl = null
    this.supabaseKey = null
    this.restUrl = null
    this.realtimeUrl = null
    this.defaultSchema = 'public'
    this.subscriptions = {}

    this.authenticate(supabaseUrl, supabaseKey)
  }

  authenticate(supabaseUrl, supabaseKey){
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.restUrl = supabaseUrl + '/rest/v1'
    this.realtimeUrl = `${supabaseUrl}/socket`.replace('http', 'ws')
  }

  from(tableName){
    let identifier = uuid()
    
    this.subscriptions[identifier] = new Base(
      tableName,
      this.restUrl,
      this.realtimeUrl,
      this.defaultSchema,
      this.supabaseKey,
      identifier
    )
    return this.subscriptions[identifier]
  }

  removeSubscription(mySubscription){
    mySubscription.unsubscribe()
    delete this.subscriptions[mySubscription.uuid]
  }
  
}

const createClient = (supabaseUrl, supabaseKey, options = {}) => {
  return new SupabaseClient(supabaseUrl, supabaseKey, options)
}

export { createClient }
