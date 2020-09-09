import { uuid } from './utils/Helpers'
import Realtime from './Realtime'
import { Auth } from './Auth'
import { PostgrestClient } from '@supabase/postgrest-js'

const DEPRICATED_KEY_LENGTH = 45

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey, options = { autoRefreshToken: true }) {
    this.supabaseUrl = null
    this.supabaseKey = null
    this.restUrl = null
    this.realtimeUrl = null
    this.authUrl = null
    this.schema = 'public'
    this.subscriptions = {}
    this.accessToken = null

    this.tableName = null
    this.queryFilters = []

    if (options.schema) this.schema = options.schema

    this.authenticate(supabaseUrl, supabaseKey)

    this.auth = new Auth(this.authUrl, supabaseKey, { autoRefreshToken: options.autoRefreshToken })
  }

  /**
   * General Functionalities
   */

  authenticate(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.restUrl = `${supabaseUrl}/rest/v1`
    this.realtimeUrl = `${supabaseUrl}/realtime/v1`.replace('http', 'ws')
    this.authUrl = `${supabaseUrl}/auth/v1`
  }

  clear() {
    this.tableName = null
    this.queryFilters = []
  }

  from(tableName) {
    this.tableName = tableName
    return this
  }

  /**
   * Realtime Functionalities
   */

  on(eventType, callbackFunction) {
    let identifier = uuid()

    this.subscriptions[identifier] = new Realtime(
      this.tableName,
      this.realtimeUrl,
      this.schema,
      this.supabaseKey,
      identifier,
      eventType,
      callbackFunction,
      this.queryFilters
    )

    this.clear()
    return this.subscriptions[identifier]
  }

  getSubscriptions() {
    return Object.values(this.subscriptions)
  }

  removeSubscription(mySubscription) {
    mySubscription.unsubscribe()
    delete this.subscriptions[mySubscription.uuid]
  }

  /**
   * REST Functionalities
   */

  rpc(functionName, functionParameters = null) {
    let rest = new PostgrestClient(this.restUrl, {
      headers: { apikey: this.supabaseKey },
      schema: this.schema,
    })
    return rest.rpc(functionName, functionParameters)
  }

  initClient() {
    let headers = { apikey: this.supabaseKey }

    if (this.supabaseKey.length > DEPRICATED_KEY_LENGTH && this.accessToken)
      headers['Authorization'] = `Bearer ${this.accessToken}`
    // if (this.supabaseKey.length > DEPRICATED_KEY_LENGTH && this.auth.authHeader())
    //   headers['Authorization'] = this.auth.authHeader()

    let rest = new PostgrestClient(this.restUrl, {
      headers,
      schema: this.schema,
    })
    let api = rest.from(this.tableName)

    // go through queryFilters
    this.queryFilters.forEach((queryFilter) => {
      switch (queryFilter.filter) {
        case 'filter':
          api.filter(queryFilter.columnName, queryFilter.operator, queryFilter.criteria)
          break

        case 'match':
          api.match(queryFilter.query)
          break

        case 'order':
          api.order(queryFilter.property, queryFilter.ascending, queryFilter.nullsFirst)
          break

        case 'range':
          api.range(queryFilter.from, queryFilter.to)
          break

        case 'single':
          api.single()
          break

        default:
          break
      }
    })

    this.clear()
    return api
  }

  select(columnQuery = '*', options = {}) {
    let api = this.initClient()
    return api.select(columnQuery, options)
  }

  insert(data, options = {}) {
    let api = this.initClient()
    return api.insert(data, options)
  }

  update(data, options = {}) {
    let api = this.initClient()
    return api.update(data, options)
  }

  delete(options = {}) {
    let api = this.initClient()
    return api.delete(options)
  }

  filter(columnName, operator, criteria) {
    this.queryFilters.push({
      filter: 'filter',
      columnName,
      operator,
      criteria,
    })

    return this
  }

  match(query) {
    this.queryFilters.push({
      filter: 'match',
      query,
    })

    return this
  }

  order(property, ascending = false, nullsFirst = false) {
    this.queryFilters.push({
      filter: 'order',
      property,
      ascending,
      nullsFirst,
    })

    return this
  }

  range(from, to) {
    this.queryFilters.push({
      filter: 'range',
      from,
      to,
    })

    return this
  }

  single() {
    this.queryFilters.push({ filter: 'single' })

    return this
  }

  setAccessToken(value) {
    this.accessToken = value
  }
}

// pre-empts if any of the filters are used before select
const advancedFilters = [
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'like',
  'ilike',
  'is',
  'in',
  'cs',
  'cd',
  'ova',
  'ovr',
  'sl',
  'sr',
  'nxr',
  'nxl',
  'adj',
]

advancedFilters.forEach(
  (operator) =>
    (SupabaseClient.prototype[operator] = function filterValue(columnName, criteria) {
      return this.filter(columnName, operator, criteria)
    })
)

const createClient = (supabaseUrl, supabaseKey, options = {}) => {
  return new SupabaseClient(supabaseUrl, supabaseKey, options)
}

export { createClient }
