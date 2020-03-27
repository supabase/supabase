import { Socket } from '@supabase/realtime-js'
import { PostgrestClient } from '@supabase/postgrest-js'
import * as ChangeMapper from './utils/ChangeMapper'

class Supabase {
  constructor(tableName, restUrl, realtimeUrl, schema, apikey, uuid) {
    this.tableName = tableName
    this.restUrl = restUrl
    this.realtimeUrl = realtimeUrl
    this.schema = schema
    this.uuid = uuid
    this.apikey = apikey

    this.socket = null
    this.channel = null
    this.listeners = {}

    this.queryFilters = []
  }

  /**
   * REALTIME FUNCTIONALITY
   */

  createListener() {
    let socketUrl = `${this.realtimeUrl}`

    var filterString = ''
    this.queryFilters.forEach(queryFilter => {
      switch (queryFilter.filter) {
        case 'filter':
          // temporary solution
          // this is the only thing we are supporting at the moment
          if (queryFilter.operator === 'eq') {
            // right now, the string is replaced instead of being stacked
            // the server does not support multiple eq. statements
            // as such, we will only process the very last eq. statement provided
            filterString = `:${queryFilter.columnName}=${queryFilter.operator}.${queryFilter.criteria}`
          }
          break
        default:
          break
      }
    })

    let channel =
      this.tableName == '*'
        ? 'realtime:*'
        : `realtime:${this.schema}:${this.tableName}${filterString}`
    this.socket = new Socket(socketUrl, { headers: { apikey: this.apikey } })
    this.channel = this.socket.channel(channel)

    this.socket.onOpen(() => {
      console.debug(`${this.realtimeUrl}: REALTIME CONNECTED`)
    })
    this.socket.onClose(() => {
      console.debug(`${this.realtimeUrl}: REALTIME DISCONNECTED`)
    })
  }

  on(eventType, callbackFunction) {
    if (this.socket == null) this.createListener()

    this.channel.on(eventType, payload => {
      let payloadEnriched = {
        schema: payload.schema,
        table: payload.table,
        commit_timestamp: payload.commit_timestamp,
      }
      let newData = {}
      let oldData = {}
      let oldDataEnriched = {}

      switch (payload.type) {
        case 'INSERT':
          newData = ChangeMapper.convertChangeData(payload.columns, payload.record)
          payloadEnriched.eventType = 'INSERT'
          payloadEnriched.new = newData

          break

        case 'UPDATE':
          oldData = ChangeMapper.convertChangeData(payload.columns, payload.old_record)
          newData = ChangeMapper.convertChangeData(payload.columns, payload.record)

          Object.keys(oldData).forEach(key => {
            if (oldData[key] != null) oldDataEnriched[key] = oldData[key]
          })

          payloadEnriched.eventType = 'UPDATE'
          payloadEnriched.old = oldDataEnriched
          payloadEnriched.new = newData

          break

        case 'DELETE':
          oldData = ChangeMapper.convertChangeData(payload.columns, payload.old_record)

          Object.keys(oldData).forEach(key => {
            if (oldData[key] != null) oldDataEnriched[key] = oldData[key]
          })

          payloadEnriched.eventType = 'DELETE'
          payloadEnriched.old = oldDataEnriched

          break

        default:
          break
      }

      callbackFunction(payloadEnriched)
    })

    this.listeners[eventType] = callbackFunction
    return this
  }

  subscribe() {
    if (this.socket == null) this.createListener()

    this.socket.connect()

    if (this.channel.state !== 'joined') {
      this.channel
        .join()
        .receive('ok', resp =>
          console.debug(`${this.realtimeUrl}: Joined Realtime successfully `, resp)
        )
        .receive('error', resp => console.debug(`${this.realtimeUrl}: Unable to join `, resp))
        .receive('timeout', () =>
          console.debug(`${this.realtimeUrl}: Network timeout. Still waiting...`)
        )
    }

    return this
  }

  unsubscribe() {
    if (this.socket) this.socket.disconnect()

    return this
  }

  /**
   * REST FUNCTIONALITIES
   */

  initClient() {
    let rest = new PostgrestClient(this.restUrl, { headers: { apikey: this.apikey } })
    let api = rest.from(this.tableName)

    // go through queryFilters
    this.queryFilters.forEach(queryFilter => {
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
}

// pre-empts if any of the filters are used before select
const advancedFilters = ['eq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'not']

advancedFilters.forEach(
  operator =>
    (Supabase.prototype[operator] = function filterValue(columnName, criteria) {
      return this.filter(columnName, operator, criteria)
    })
)

export default Supabase
