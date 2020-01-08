/**
* This files draws heavily from https://github.com/calebmer/postgrest-client
* License: https://github.com/calebmer/postgrest-client/blob/master/LICENSE
*/

import { Request } from 'superagent'

const contentRangeStructure = /^(\d+)-(\d+)\/(\d+)$/

/**
 * A request building object which contains convenience methods for
 * communicating with a PostgREST server.
 *
 * @class
 * @param {string} The HTTP method of the request.
 * @param {string} The path to the request.
 */

class BaseRequest extends Request {
  constructor (method, path) {
    super(method, path)
    this.set('Accept', 'application/json')

    // Fix for superagent disconnect on client & server.
    if (!this.get) {
      this.get = this.getHeader
    }
  }

  /**
   * Set auth using special formats. If only one string paramter is passed, it
   * is interpreted as a bearer token. If an object and nothing else is passed,
   * `user` and `pass` keys are extracted from it and used for basic auth.
   *
   * @param {string|object} The user, bearer token, or user/pass object.
   * @param {string|void} The pass or undefined.
   * @returns {BaseRequest} The API request object.
   */

  auth (user, pass) {
    if (typeof user === 'string' && pass == null) {
      this.set('Authorization', `Bearer ${user}`)
      return this
    }

    if (typeof user === 'object' && pass == null) {
      pass = user.pass
      user = user.user
    }

    return super.auth(user, pass)
  }

  /**
   * Takes a query object and translates it to a PostgREST filter query string.
   * All values are prefixed with `eq.`.
   *
   * @param {object} The object to match against.
   * @returns {BaseRequest} The API request object.
   */

  match (query) {
    const newQuery = {}
    Object.keys(query).forEach(key => newQuery[key] = `eq.${query[key]}`)
    return this.query(newQuery)
  }

  /**
   * Cleans up a select string by stripping all whitespace. Then the string is
   * set as a query string value. Also always forces a root @id column.
   *
   * @param {string} The unformatted select string.
   * @returns {BaseRequest} The API request object.
   */

  select (select) {
    if (select) {
      this.query({ select: select.replace(/\s/g, '') })
    }

    return this
  }

  /**
   * Tells PostgREST in what order the result should be returned.
   *
   * @param {string} The property name to order by.
   * @param {bool} True for descending results, false by default.
   * @param {bool} True for nulls first, false by default.
   * @returns {BaseRequest} The API request object.
   */

  order (property, ascending = false, nullsFirst = false) {
    this.query(`order=${property}.${ascending ? 'asc' : 'desc'}.${nullsFirst ? 'nullsfirst' : 'nullslast'}`)
    return this
  }

  /**
   * Specify a range of items for PostgREST to return. If the second value is
   * not defined, the rest of the collection will be sent back.
   *
   * @param {number} The first object to select.
   * @param {number|void} The last object to select.
   * @returns {BaseRequest} The API request object.
   */

  range (from, to) {
    this.set('Range-Unit', 'items')
    this.set('Range', `${from || 0}-${to || ''}`)
    return this
  }

  /**
   * Sets the header which signifies to PostgREST the response must be a single
   * object or 404.
   *
   * @returns {BaseRequest} The API request object.
   */

  single () {
    return this.set('Prefer', 'plurality=singular')
  }

  /**
   * Sends the request and returns a promise. The super class uses the errback
   * pattern, but this function overrides that preference to use a promise.
   *
   * @returns {Promise} Resolves when the request has completed.
   */

  end () {
    return new Promise((resolve, reject) =>
      super.end((error, response) => {
        if (error) {
          return reject(error)
        }

        const { body, headers, status, statusCode, statusText } = response
        const contentRange = headers['content-range']

        if (Array.isArray(body) && contentRange && contentRangeStructure.test(contentRange)) {
          body.fullLength = parseInt(contentRangeStructure.exec(contentRange)[3], 10)
        }

        const returnBody = { body, status, statusCode, statusText}

        return resolve(returnBody)
      })
    )
  }

  /**
   * Makes the BaseRequest object then-able. Allows for usage with
   * `Promise.resolve` and async/await contexts. Just a proxy for `.then()` on
   * the promise returned from `.end()`.
   *
   * @param {function} Called when the request resolves.
   * @param {function} Called when the request errors.
   * @returns {Promise} Resolves when the resolution resolves.
   */

  then (resolve, reject) {
    return this.end().then(resolve, reject)
  }

  /**
   * Just a proxy for `.catch()` on the promise returned from `.end()`.
   *
   * @param {function} Called when the request errors.
   * @returns {Promise} Resolves when there is an error.
   */

  catch (reject) {
    return this.end().catch(reject)
  }
}

/**
 * For all of the PostgREST filters add a shortcut method to use it.
 *
 * @param {string} The name of the column.
 * @param {any} The value of the column to be filtered.
 * @returns {BaseRequest} The API request object.
 */

const filters = ['eq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'not']

filters.forEach(filter =>
  BaseRequest.prototype[filter] = function filterValue (name, value) {
    return this.query(`${name}=${filter}.${Array.isArray(value) ? value.join(',') : value}`)
  }
)

export default BaseRequest



