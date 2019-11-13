import * as constants from '../utils/constants.js'
import * as postgres from '../utils/postgres.js'

var fs = require('fs')
var path = require('path')
var getAllSql = fs.readFileSync(path.join(__dirname, '../sql/getAllConfig.sql')).toString()

/**
 * Gets all the config for a 
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
 *    { 
 *      name: 'autovacuum',
 *      setting: 'on',
 *      unit: null,
 *      category: 'Autovacuum',
 *      short_desc: 'Starts the autovacuum subprocess.',
 *      extra_desc: null,
 *      context: 'sighup',
 *      vartype: 'bool',
 *      source: 'default',
 *      min_val: null,
 *      max_val: null,
 *      enumvals: null,
 *      boot_val: 'on',
 *      reset_val: 'on',
 *      sourcefile: null,
 *      sourceline: null,
 *      pending_restart: false 
 *    }
 * ]
 */
export const getAll = async (config = {}) => {
  const dbConfig = { ...constants.POSTGRES_CONFIG, ...config }
  const conn = await postgres.connect(dbConfig)
  const results = await postgres.runQuery(conn, getAllSql)
  postgres.disconnect(conn)
  return results.rows
}
