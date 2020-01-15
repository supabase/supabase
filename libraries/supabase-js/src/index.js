import { uuid } from './utils/Helpers'
import Base from './Base'

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey, options = {}) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey

    this.restUrl = null
    this.apiSocket = null
    this.schema = null
    this.subscriptions = {}

    this.authenticate(supabaseUrl, supabaseKey)
  }

  authenticate(supabaseUrl, supabaseKey){
    // do something to utilise parameters and receive
    // the restUrl, apiSocket and schema
    
    var restUrl = ''
    var apiSocket = ''
    var schema = ''

    this.restUrl = 'http://localhost:3000'
    this.apiSocket = 'ws://localhost:4000/socket'
    this.schema = 'public'
  }

  from(tableName){
    let identifier = uuid()
    
    this.subscriptions[identifier] = new Base(tableName, this.restUrl, this.apiSocket, this.schema, identifier)
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
