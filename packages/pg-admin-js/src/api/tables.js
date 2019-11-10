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
 * @param {string} config.POSTGRES_USER
 * @param {string} config.POSTGRES_PASSWORD
 * @param {string} config.POSTGRES_DATABASE
 * @param {number} config.POSTGRES_PORT
 *
 * @example
 * getAll(['public', {POSTGRES_DATABASE: 'pg_admin_test'})
 * //=>
 * ['users', 'products']
 */
export const getAll = async (config = {}, options = {}) => {
  const dbConfig = { ...constants.POSTGRES_CONFIG, ...config }
  const schema = options.schema || constants.DEFAULT_SCHEMA
  const conn = await postgres.connect(dbConfig)
  const tables = await postgres.runQuery(conn, schema, getAllTablesSql)
  postgres.disconnect(conn)
  return tables
}
