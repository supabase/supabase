import * as constants from '../utils/constants.js'
import * as postgres from '../utils/postgres.js'

var fs = require('fs')
var path = require('path')
var getAllTablesSql = fs.readFileSync(path.join(__dirname, '../sql/getAllTables.sql')).toString()

/**
 * Takes an array of columns and an object of string values then converts each string value
 * to its mapped type
 * @param {string} schema The database schema containing the tables
 * @param {Object} config The database config
 * @param {string} config.host
 * @param {string} config.user
 * @param {string} config.password
 * @param {string} config.database
 * @param {number} config.port
 * @param {Object} options
 * @param {string} options.schema
 *
 * @example
 * await getAll()
 * //=>
 * [
 *    { table_schema: 'public', table_name: 'users' }
 * ]
 */
export const getAll = async (config = {}, options = {}) => {
  const dbConfig = { ...constants.POSTGRES_CONFIG, ...config }
  const schema = options.schema || constants.DEFAULT_SCHEMA
  const conn = await postgres.connect(dbConfig)
  const results = await postgres.runQuery(conn, schema, getAllTablesSql)
  postgres.disconnect(conn)
  return results.rows
}
