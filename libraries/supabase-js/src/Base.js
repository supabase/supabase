import { Socket } from 'phoenix-channels'
import BaseRequest from './BaseRequest'

class Base {
  constructor(tableName, restUrl, apiSocket, uuid) {
    this.tableName = tableName
    this.restUrl = restUrl
    this.apiSocket = apiSocket
    this.uuid = uuid

    this.socket = null
    this.channel = null
    this.listeners = {}

    this.queryFilters = []
  }

  createListener() {
    this.socket = new Socket(apiSocket)
    this.channel = this.socket.channel(this.tableName)
  }

  on(eventType, callbackFunction) {
    if (this.socket == null) this.createListener()

    var ref = this.channel.on(eventType, callbackFunction)
    this.listeners[eventType] = ref
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
  }

  unsubscribe() {
    for (var ref in this.listeners) {
      let eventName = this.listeners[ref]
      this.off(eventName, ref)
    }

    this.socket.disconnect()
  }

  request(method) {
    let path = `${this.restUrl}/${this.tableName}`
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