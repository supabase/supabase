const {Socket} = require('@supabase/realtime-js')
import BaseRequest from './BaseRequest'

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

  createListener() {
    let socketUrl = `${this.realtimeUrl}?apikey=${this.apikey}`
    let channel = `realtime:${this.schema}:${this.tableName}`
    this.socket = new Socket(socketUrl)
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
    var ref = this.channel.on(eventType, callbackFunction)
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
      let columnName = queryFilter.columnName
      let operator = queryFilter.operator
      let criteria = queryFilter.criteria

      request.filter(columnName, operator, criteria)
    })
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
const filters = ['eq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'not']

filters.forEach(
  operator =>
    (Base.prototype[operator] = function filterValue(columnName, criteria) {
      this.queryFilters.push({
        columnName,
        operator,
        criteria,
      })
      return this
    })
)

export default Base