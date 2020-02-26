import { uuid } from './utils/Helpers'
import Supabase from './Supabase'
import { PostgrestClient } from '@supabase/postgrest-js'

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

  authenticate(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.restUrl = `${supabaseUrl}/rest/v1`
    this.realtimeUrl = `${supabaseUrl}/realtime/v1`.replace('http', 'ws')
  }

  from(tableName) {
    let identifier = uuid()

    this.subscriptions[identifier] = new Supabase(
      tableName,
      this.restUrl,
      this.realtimeUrl,
      this.defaultSchema,
      this.supabaseKey,
      identifier
    )
    return this.subscriptions[identifier]
  }

  rpc(functionName, functionParameters = null) {
    let rest = new PostgrestClient(this.restUrl, { queryParams: { apikey: this.supabaseKey } })
    return rest.rpc(functionName, functionParameters)
  }

  getSubscriptions() {
    return Object.values(this.subscriptions)
  }

  removeSubscription(mySubscription) {
    mySubscription.unsubscribe()
    delete this.subscriptions[mySubscription.uuid]
  }
}

const createClient = (supabaseUrl, supabaseKey, options = {}) => {
  return new SupabaseClient(supabaseUrl, supabaseKey, options)
}

export { createClient }
