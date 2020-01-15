import BaseRequest from './BaseRequest'
import Subscription from './Subscription'
import { uuid } from './utils/Helpers'
import Base from './Base'

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey, options = {}) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey

    this.restUrl = null
    this.apiSocket = null
    this.subscriptions = {}

    this.authenticate(supabaseUrl, supabaseKey)
  }

  authenticate(supabaseUrl, supabaseKey){
    // do something to utilise parameters and receive
    // the restUrl & apiSocket
    
    var restUrl = supabaseUrl
    var apiSocket = ''

    this.restUrl = restUrl
    this.apiSocket = apiSocket
  }

  from(tableName){
    let identifier = uuid()
    
    this.subscriptions[identifier] = new Base(tableName, this.restUrl, this.apiSocket, identifier)
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
