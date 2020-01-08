import BaseRequest from './BaseRequest'
import BaseChannel from './BaseChannel'
import { uuid } from './utils/Helpers'

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey, options) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey

    // this will be the case for now
    this.restUrl = supabaseUrl
    this.apiSocket = ''

    this.subscriptions = {}
  }

  /**
   * @todo
   */
  subscribe(tableName) {
    let uuid = uuid()

    this.subscriptions[uuid] = new BaseChannel(tableName, this.apiSocket, uuid)
    return this.subscriptions[uuid]
  }

  unsubscribe(subscription){
    subscription.stop()
    delete this.subscriptions[subscription.uuid]
  }

  /**
   * Convenience wrapper for starting a PostgREST request builder. Adds the
   * API URL to the provided path.
   *
   * @param {string} The HTTP method of the request.
   * @param {string} The path of the request.
   * @returns {BaseRequest} The API request object.
   */

  request(method, path) {
    return new BaseRequest(method, this.restUrl + path)
  }
  
}

/**
 * Basic HTTP method functions for quick chaining.
 *
 * @param {string} The path of the request.
 * @returns {BaseRequest} The API request object.
 */

const methods = ['POST', 'GET', 'PATCH', 'DELETE']

methods.forEach(method => {
  SupabaseClient.prototype[method.toLowerCase()] = function requestMethod(tableName) {
    let path = `/${tableName}`
    return this.request(method, path)
  }
})

const createClient = (supabaseUrl, supabaseKey, options = {}) => {
  return new SupabaseClient(supabaseUrl, supabaseKey, options)
}

export { createClient }

/**
 * TO BE REMOVED SOON
 */

// const defaultAwesomeFunction = (name) => {
//   const returnStr = `I am the Default Awesome Function, fellow comrade! - ${name}`;
//   return returnStr;
// };

// const awesomeFunction = () => 'I am just an Awesome Function';

// export default defaultAwesomeFunction;

// export { awesomeFunction };
