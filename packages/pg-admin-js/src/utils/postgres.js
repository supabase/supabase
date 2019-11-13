import knex from 'knex'

export function connect(config) {
  return knex({ client: 'pg', connection: config })
}

export async function disconnect(conn) {
  let cb = () => { return true }
  conn.destroy(cb)
}

/**
 * Executes a SQL string against the database
 * @param conn an open Knex connection
 * @param {string} query The SQL query
 * @param {sting[]} params An optional array of paramaters to feed into the query
 */
export function runQuery(conn, query, params = {}) {
  return conn.raw(query, params)
}
