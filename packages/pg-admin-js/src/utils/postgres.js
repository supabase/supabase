import knex from 'knex'

export function connect(config) {
  console.log('config', config)
  return require('knex')({ client: 'pg', config })
  return knex({ client: 'pg', config })
}

export async function disconnect(conn) {
  let cb = () => { return true }
  conn.destroy(cb)
}

export function runQuery(conn, schema, query) {
  return conn.raw(query, [schema])
}
