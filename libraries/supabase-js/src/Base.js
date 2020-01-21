import BaseRequest from './BaseRequest'
import { Socket } from '@supabase/realtime-js'
import * as ChangeMapper from './utils/ChangeMapper'

class Base {
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
    let channel = `realtime:${this.schema}:${this.tableName}`
    this.socket = new Socket(socketUrl, { params: { apikey: this.apikey } })
    this.channel = this.socket.channel('realtime:*') // @TODO:

    // @TODO: remove
    // Example local config
    // this.socket = new Socket(`ws://localhost:80/socket`)
    // this.channel = this.socket.channel('realtime:*')

    this.socket.onOpen(() => {
      console.log('REALTIME CONNECTED')
    })
    this.socket.onClose(() => {
      console.log('REALTIME DISCONNECTED')
    })
  }

  on(eventType, callbackFunction) {
    if (this.socket == null) this.createListener()
    // var ref = this.channel.on(eventType, callbackFunction)

    var ref = this.channel.on(eventType, payload => {
      let payloadEnriched = {}
      let newData = {}
      let oldData = {}
      let oldDataEnriched = {}

      switch (payload.type) {
        case 'INSERT':
          newData = ChangeMapper.convertChangeData(payload.columns, payload.record)
          payloadEnriched = {
            eventType: 'INSERT',
            new: newData,
          }
          break

        case 'UPDATE':
          oldData = ChangeMapper.convertChangeData(payload.columns, payload.old_record)
          newData = ChangeMapper.convertChangeData(payload.columns, payload.record)

          Object.keys(oldData).forEach(key => {
            if (oldData[key] != null) oldDataEnriched[key] = oldData[key]
          })

          payloadEnriched = {
            eventType: 'UPDATE',
            old: oldDataEnriched,
            new: newData,
          }
          break

        case 'DELETE':
          oldData = ChangeMapper.convertChangeData(payload.columns, payload.old_record)

          Object.keys(oldData).forEach(key => {
            if (oldData[key] != null) oldDataEnriched[key] = oldData[key]
          })

          payloadEnriched = {
            eventType: 'DELETE',
            old: oldDataEnriched,
          }
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

  request(method) {
    let path = `${this.restUrl}/${this.tableName}?apikey=${this.apikey}`
    return new BaseRequest(method, path)
  }

  addFilters(request, options) {
    if (Object.keys(options).length != 0) {
      Object.keys(options).forEach(option => {
        let setting = options[option]
        request.set(option, setting)
      })
    }

    // loop through this.queryFilters
    this.queryFilters.forEach(queryFilter => {
      switch (queryFilter.filter) {
        case 'filter':
          request.filter(queryFilter.columnName, queryFilter.operator, queryFilter.criteria)
          break

        case 'match':
          request.match(queryFilter.query)
          break

        case 'order':
          request.order(queryFilter.property, queryFilter.ascending, queryFilter.nullsFirst)
          break

        case 'range':
          request.range(queryFilter.from, queryFilter.to)
          break

        case 'single':
          request.single()
          break

        default:
          break
      }
    })
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

  select(columnQuery = '*', options = {}) {
    let method = 'get'
    let request = this.request(method)

    request.select(columnQuery)
    this.addFilters(request, options)

    return request
  }

  insert(data, options = {}) {
    let method = 'post'
    let request = this.request(method)

    if (!Array.isArray(data)) {
      return {
        body: null,
        status: 400,
        statusCode: 400,
        statusText: 'Data type should be an array.',
      }
    }

    data.forEach(datum => {
      request.send(datum)
    })

    this.addFilters(request, options)

    return request
  }

  update(data, options = {}) {
    let method = 'patch'
    let request = this.request(method)

    request.send(data)
    this.addFilters(request, options)

    return request
  }

  delete(options = {}) {
    let method = 'delete'
    let request = this.request(method)

    this.addFilters(request, options)

    return request
  }
}

// pre-empts if any of the filters are used before select
const advancedFilters = ['eq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'not']

advancedFilters.forEach(
  operator =>
    (Base.prototype[operator] = function filterValue(columnName, criteria) {
      this.filter(columnName, operator, criteria)
      return this
    })
)

export default Base
