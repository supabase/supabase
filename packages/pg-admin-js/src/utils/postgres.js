import knex from 'knex'

export function connect(config) {
  return knex({ client: 'pg', connection: config })
}

export async function disconnect(conn) {
  let cb = () => { return true }
  conn.destroy(cb)
}

export function runQuery(conn, schema, query) {
  return conn.raw(query, [schema])
}
