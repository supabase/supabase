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
  }

  /**
   * REALTIME FUNCTIONALITY
   */

  createListener() {
    let socketUrl = `${this.realtimeUrl}`
    let channel = this.tableName == "*" ? 'realtime:*' : `realtime:${this.schema}:${this.tableName}`
    this.socket = new Socket(socketUrl, { params: { apikey: this.apikey } })
    this.channel = this.socket.channel(channel)

    this.socket.onOpen(() => {
      console.log('REALTIME CONNECTED')
    })
    this.socket.onClose(() => {
      console.log('REALTIME DISCONNECTED')
    })
  }

  on(eventType, callbackFunction) {
    if (this.socket == null) this.createListener()

    var ref = this.channel.on(eventType, payload => {
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

    this.listeners[eventType] = ref
    return this
  }

  subscribe() {
    if (this.socket == null) this.createListener()

    this.socket.connect()

    if (this.channel.state !== 'joined') {
      this.channel
        .join()
        .receive('ok', resp => console.log('Joined Realtime successfully ', resp))
        .receive('error', resp => console.log('Unable to join ', resp))
        .receive('timeout', () => console.log('Networking issue. Still waiting...'))
    }

    return this
  }

  unsubscribe() {
    this.socket.disconnect()

    return this
  }

  /**
   * REST FUNCTIONALITIES
   */

  initClient() {
    let rest = new PostgrestClient(this.restUrl, {queryParams: { apikey: this.apikey }})
    let api = rest.from(this.tableName)

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
    let api = this.initClient()
    return api.filter(columnName, operator, criteria)
  }

  match(query) {
    let api = this.initClient()
    return api.match(query)
  }

  order(property, ascending = false, nullsFirst = false) {
    let api = this.initClient()
    return api.order(property, ascending, nullsFirst)
  }

  range(from, to) {
    let api = this.initClient()
    return api.range(from, to)
  }

  single() {
    let api = this.initClient()
    return api.single()
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
