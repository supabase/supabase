

class SupabaseClient {
  constructor(supbaseUrl, supabaseKey, options) {
    this.listeners = []
    this.supbaseUrl = supbaseUrl
    this.supabaseKey = supabaseKey
  }

  /**
   * @todo
   */
  subscribe () {
    this.listeners.push()
  }
}

/**
 * Instantiate a new Supabase Client
 * @param supbaseUrl
 * @param supabaseKey
 * @param options
 */
const createClient = (supbaseUrl, supabaseKey, options = {}) => {
  return new SupabaseClient(supbaseUrl, supabaseKey, options)
} 

export { createClient }



/**
 * 
 * 
 * 
 * 
 * REMOVE BELOW 
 * 
 * 
 * 
 * 
 * 
 */
const defaultAwesomeFunction = (name) => {
  const returnStr = `I am the Default Awesome Function, fellow comrade! - ${name}`;
  return returnStr;
};

const awesomeFunction = () => 'I am just an Awesome Function';

export default defaultAwesomeFunction;

export { awesomeFunction };
