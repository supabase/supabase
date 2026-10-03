import { t, nt, ot } from '../shared/test.js' // eslint-disable-line
import net from 'node:net'
import fs from 'node:fs'
import crypto from 'node:crypto'

import postgres from 'postgres'
const delay = ms => new Promise(r => setTimeout(r, ms))

const rel = x => new URL(x, import.meta.url)
const idle_timeout = t.timeout

const login = {
  user: process.env.PGUSER,
  pass: process.env.PGPASS,
}

//const login_md5 = {
//  user: 'postgres_js_test_md5',
//  pass: 'postgres_js_test_md5'
//}
//
//const login_scram = {
//  user: 'postgres_js_test_scram',
//  pass: 'postgres_js_test_scram'
//}

const options = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  db: process.env.PGDATABASE,
  ssl: (process.env.PGSSL ? { rejectUnauthorized: false } : false),
  prepare: (process.env.PGMODE != 'transaction'),
  user: login.user,
  pass: login.pass,
  idle_timeout,
  connect_timeout: t.timeout,
  max: 1
}

const sql = postgres(options)

await sql`DROP SCHEMA IF EXISTS test CASCADE`
await sql`CREATE SCHEMA test`

//t('Connects with no options', async() => {
//  const sql = postgres({ max: 1 })
//
//  const result = (await sql`select 1 as x`)[0].x
//  await sql.end()
//
//  return [1, result]
//})

//t('Uses default database without slash', async() => {
//  const sql = postgres('postgres://localhost')
//  return [sql.options.user, sql.options.database]
//})
//
//t('Uses default database with slash', async() => {
//  const sql = postgres('postgres://localhost/')
//  return [sql.options.user, sql.options.database]
//})

t('Result is array', async() =>
  [true, Array.isArray(await sql`select 1`)]
)

t('Result has count', async() =>
  [1, (await sql`select 1`).count]
)

t('Result has command', async() =>
  ['SELECT', (await sql`select 1`).command]
)

t('Create table', async() =>
  ['CREATE TABLE', (await sql`create table test.test(int int)`).command, await sql`drop table test.test`]
)

t('Drop table', { timeout: t.timeout * 2 }, async() => {
  await sql`create table test.test(int int)`
  return ['DROP TABLE', (await sql`drop table test.test`).command]
})

t('null', async() =>
  [null, (await sql`select ${ null } as x`)[0].x]
)

t('Integer', async() =>
  ['1', (await sql`select ${ 1 } as x`)[0].x]
)

t('String', async() =>
  ['hello', (await sql`select ${ 'hello' } as x`)[0].x]
)

t('Boolean false', async() =>
  [false, (await sql`select ${ false } as x`)[0].x]
)

t('Boolean true', async() =>
  [true, (await sql`select ${ true } as x`)[0].x]
)

t('Date', async() => {
  const now = new Date()
  return [0, now - (await sql`select ${ now } as x`)[0].x]
})

t('Json', async() => {
  const x = (await sql`select ${ sql.json({ a: 'hello', b: 42 }) } as x`)[0].x
  return ['hello,42', [x.a, x.b].join()]
})

t('implicit json', async() => {
  const x = (await sql`select ${ { a: 'hello', b: 42 } }::json as x`)[0].x
  return ['hello,42', [x.a, x.b].join()]
})

t('implicit jsonb', async() => {
  const x = (await sql`select ${ { a: 'hello', b: 42 } }::jsonb as x`)[0].x
  return ['hello,42', [x.a, x.b].join()]
})

t('Empty array', async() =>
  [true, Array.isArray((await sql`select ${ sql.array([], 1009) } as x`)[0].x)]
)

t('String array', async() =>
  ['123', (await sql`select ${ '{1,2,3}' }::int[] as x`)[0].x.join('')]
)

t('Array of Integer', async() =>
  ['3', (await sql`select ${ sql.array([1, 2, 3]) } as x`)[0].x[2]]
)

t('Array of String', async() =>
  ['c', (await sql`select ${ sql.array(['a', 'b', 'c']) } as x`)[0].x[2]]
)

t('Array of Date', async() => {
  const now = new Date()
  return [now.getTime(), (await sql`select ${ sql.array([now, now, now]) } as x`)[0].x[2].getTime()]
})

t('Array of Box', async() => [
  '(3,4),(1,2);(6,7),(4,5)',
  (await sql`select ${ '{(1,2),(3,4);(4,5),(6,7)}' }::box[] as x`)[0].x.join(';')
])

t('Nested array n2', async() =>
  ['4', (await sql`select ${ sql.array([[1, 2], [3, 4]]) } as x`)[0].x[1][1]]
)

t('Nested array n3', async() =>
  ['6', (await sql`select ${ sql.array([[[1, 2]], [[3, 4]], [[5, 6]]]) } as x`)[0].x[2][0][1]]
)

t('Escape in arrays', async() =>
  ['Hello "you",c:\\windows', (await sql`select ${ sql.array(['Hello "you"', 'c:\\windows']) } as x`)[0].x.join(',')]
)

t('Escapes', async() => {
  return ['hej"hej', Object.keys((await sql`select 1 as ${ sql('hej"hej') }`)[0])[0]]
})

t('null for int', async() => {
  await sql`create table test.test (x int)`
  return [1, (await sql`insert into test.test values(${ null })`).count, await sql`drop table test.test`]
})

t('Throws on illegal transactions', async() => {
  const sql = postgres({ ...options, max: 2, fetch_types: false })
  const error = await sql`begin`.catch(e => e)
  return [
    error.code,
    'UNSAFE_TRANSACTION'
  ]
})

t('Transaction throws', async() => {
  await sql`create table test.test (a int)`
  return ['22P02', await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql`insert into test.test values('hej')`
  }).catch(x => x.code), await sql`drop table test.test`]
})

t('Transaction rolls back', async() => {
  await sql`create table test.test (a int)`
  await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql`insert into test.test values('hej')`
  }).catch(() => { /* ignore */ })
  return [0, (await sql`select a from test.test`).count, await sql`drop table test.test`]
})

t('Transaction throws on uncaught savepoint', async() => {
  await sql`create table test.test (a int)`

  return ['fail', (await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql.savepoint(async sql => {
      await sql`insert into test.test values(2)`
      throw new Error('fail')
    })
  }).catch((err) => err.message)), await sql`drop table test.test`]
})

t('Transaction throws on uncaught named savepoint', async() => {
  await sql`create table test.test (a int)`

  return ['fail', (await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql.savepoit('watpoint', async sql => {
      await sql`insert into test.test values(2)`
      throw new Error('fail')
    })
  }).catch(() => 'fail')), await sql`drop table test.test`]
})

t('Transaction succeeds on caught savepoint', async() => {
  await sql`create table test.test (a int)`
  await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql.savepoint(async sql => {
      await sql`insert into test.test values(2)`
      throw new Error('please rollback')
    }).catch(() => { /* ignore */ })
    await sql`insert into test.test values(3)`
  })

  return ['2', (await sql`select count(1) from test.test`)[0].count, await sql`drop table test.test`]
})

t('Savepoint returns Result', async() => {
  let result
  await sql.begin(async sql => {
    result = await sql.savepoint(sql =>
      sql`select 1 as x`
    )
  })

  return [1, result[0].x]
})

// Reason: disabled because of security reasons
//
//t('Prepared transaction', async() => {
//  await sql`create table test.test (a int)`
//
//  await sql.begin(async sql => {
//    await sql`insert into test values(1)`
//    await sql.prepare('tx1')
//  })
//
//  await sql`commit prepared 'tx1'`
//
//  return ['1', (await sql`select count(1) from test`)[0].count, await sql`drop table test`]
//})

t('Transaction requests are executed implicitly', async() => {
  const sql = postgres({ ...options, debug: true, idle_timeout: 1, fetch_types: false })
  return [
    'testing',
    (await sql.begin(sql => [
      sql`select set_config('postgres_js.test', 'testing', true)`,
      sql`select current_setting('postgres_js.test') as x`
    ]))[1][0].x
  ]
})

t('Uncaught transaction request errors bubbles to transaction', async() => [
  '42703',
  (await sql.begin(sql => [
    sql`select wat`,
    sql`select current_setting('postgres_js.test') as x, ${ 1 } as a`
  ]).catch(e => e.code))
])

t('Fragments in transactions', async() => [
  true,
  (await sql.begin(sql => sql`select true as x where ${ sql`1=1` }`))[0].x
])

t('Transaction rejects with rethrown error', async() => [
  'WAT',
  await sql.begin(async sql => {
    try {
      await sql`select exception`
    } catch (ex) {
      throw new Error('WAT')
    }
  }).catch(e => e.message)
])

t('Parallel transactions', async() => {
  await sql`create table test.test (a int)`
  return ['11', (await Promise.all([
    sql.begin(sql => sql`select 1`),
    sql.begin(sql => sql`select 1`)
  ])).map(x => x.count).join(''), await sql`drop table test.test`]
})

t('Many transactions at beginning of connection', async() => {
  const sql = postgres(options)
  const xs = await Promise.all(Array.from({ length: 100 }, () => sql.begin(sql => sql`select 1`)))
  return [100, xs.length]
})

t('Transactions array', async() => {
  await sql`create table test.test (a int)`

  return ['11', (await sql.begin(sql => [
    sql`select 1`.then(x => x),
    sql`select 1`
  ])).map(x => x.count).join(''), await sql`drop table test.test`]
})

t('Transaction waits', async() => {
  await sql`create table test.test (a int)`
  await sql.begin(async sql => {
    await sql`insert into test.test values(1)`
    await sql.savepoint(async sql => {
      await sql`insert into test.test values(2)`
      throw new Error('please rollback')
    }).catch(() => { /* ignore */ })
    await sql`insert into test.test values(3)`
  })

  return ['11', (await Promise.all([
    sql.begin(sql => sql`select 1`),
    sql.begin(sql => sql`select 1`)
  ])).map(x => x.count).join(''), await sql`drop table test.test`]
})

t('Helpers in Transaction', async() => {
  return ['1', (await sql.begin(async sql =>
    await sql`select ${ sql({ x: 1 }) }`
  ))[0].x]
})

t('Undefined values throws', async() => {
  let error

  await sql`
    select ${ undefined } as x
  `.catch(x => error = x.code)

  return ['UNDEFINED_VALUE', error]
})

t('Transform undefined', async() => {
  const sql = postgres({ ...options, transform: { undefined: null } })
  return [null, (await sql`select ${ undefined } as x`)[0].x]
})

t('Transform undefined in array', async() => {
  const sql = postgres({ ...options, transform: { undefined: null } })
  return [null, (await sql`select * from (values ${ sql([undefined, undefined]) }) as x(x, y)`)[0].y]
})

t('Null sets to null', async() =>
  [null, (await sql`select ${ null } as x`)[0].x]
)

t('Throw syntax error', async() =>
  ['42601', (await sql`wat 1`.catch(x => x)).code]
)

t('Connect using uri', async() =>
  [true, await new Promise((resolve, reject) => {
    const sql = postgres(`postgres://${login.user}:${login.pass}@${options.host}:${options.port}/${options.db}`, {
      idle_timeout
    })
    sql`select 1`.then(() => resolve(true), reject)
  })]
)

t('Options from uri with special characters in user and pass', async() => {
  const opt = postgres({ user: 'öla', pass: 'pass^word' }).options
  return [[opt.user, opt.pass].toString(), 'öla,pass^word']
})

t('Fail with proper error on no host', async() =>
  ['ECONNREFUSED', (await new Promise((resolve, reject) => {
    const sql = postgres('postgres://localhost:33333/' + options.db, {
      idle_timeout
    })
    sql`select 1`.then(reject, resolve)
  })).code]
)

// REASON: No SSL in local testing (so far)
//t('Connect using SSL', async() =>
//  [true, (await new Promise((resolve, reject) => {
//    postgres({
//      ssl: { rejectUnauthorized: false },
//      idle_timeout
//    })`select 1`.then(() => resolve(true), reject)
//  }))]
//)
//
//t('Connect using SSL require', async() =>
//  [true, (await new Promise((resolve, reject) => {
//    postgres({
//      ssl: 'require',
//      idle_timeout
//    })`select 1`.then(() => resolve(true), reject)
//  }))]
//)
//
//t('Connect using SSL prefer', async() => {
//  await exec('psql', ['-c', 'alter system set ssl=off'])
//  await exec('psql', ['-c', 'select pg_reload_conf()'])
//
//  const sql = postgres({
//    ssl: 'prefer',
//    idle_timeout
//  })
//
//  return [
//    1, (await sql`select 1 as x`)[0].x,
//    await exec('psql', ['-c', 'alter system set ssl=on']),
//    await exec('psql', ['-c', 'select pg_reload_conf()'])
//  ]
//})
//
//t('Reconnect using SSL', { timeout: 2 }, async() => {
//  const sql = postgres({
//    ssl: 'require',
//    idle_timeout: 0.1
//  })
//
//  await sql`select 1`
//  await delay(200)
//
//  return [1, (await sql`select 1 as x`)[0].x]
//})
//
//t('Login without password', async() => {
//  return [true, (await postgres({ ...options, ...login })`select true as x`)[0].x]
//})

// Reason: No MD5
//t('Login using MD5', async() => {
//  return [true, (await postgres({ ...options, ...login_md5 })`select true as x`)[0].x]
//})
//
//t('Login using scram-sha-256', async() => {
//  return [true, (await postgres({ ...options, ...login_scram })`select true as x`)[0].x]
//})

// Reason: No tests for SCRAM (for now)
//t('Parallel connections using scram-sha-256', {
//  timeout: 2
//}, async() => {
//  const sql = postgres({ ...options, ...login_scram })
//  return [true, (await Promise.all([
//    sql`select true as x, pg_sleep(0.01)`,
//    sql`select true as x, pg_sleep(0.01)`,
//    sql`select true as x, pg_sleep(0.01)`
//  ]))[0][0].x]
//})
//
//t('Support dynamic password function', async() => {
//  return [true, (await postgres({
//    ...options,
//    ...login_scram,
//    pass: () => 'postgres_js_test_scram'
//  })`select true as x`)[0].x]
//})
//
//t('Support dynamic async password function', async() => {
//  return [true, (await postgres({
//    ...options,
//    ...login_scram,
//    pass: () => Promise.resolve('postgres_js_test_scram')
//  })`select true as x`)[0].x]
//})

t('Point type', async() => {
  const sql = postgres({
    ...options,
    types: {
      point: {
        to: 600,
        from: [600],
        serialize: ([x, y]) => '(' + x + ',' + y + ')',
        parse: (x) => x.slice(1, -1).split(',').map(x => +x)
      }
    }
  })

  await sql`create table test.test (x point)`
  await sql`insert into test.test (x) values (${ sql.types.point([10, 20]) })`
  return [20, (await sql`select x from test.test`)[0].x[1], await sql`drop table test.test`]
})

t('Point type array', async() => {
  const sql = postgres({
    ...options,
    types: {
      point: {
        to: 600,
        from: [600],
        serialize: ([x, y]) => '(' + x + ',' + y + ')',
        parse: (x) => x.slice(1, -1).split(',').map(x => +x)
      }
    }
  })

  await sql`create table test.test (x point[])`
  await sql`insert into test.test (x) values (${ sql.array([sql.types.point([10, 20]), sql.types.point([20, 30])]) })`
  return [30, (await sql`select x from test.test`)[0].x[1][1], await sql`drop table test.test`]
})

t('sql file', async() =>
  [1, (await sql.file(rel('select.sql')))[0].x]
)

t('sql file has forEach', async() => {
  let result
  await sql
    .file(rel('select.sql'), { cache: false })
    .forEach(({ x }) => result = x)

  return [1, result]
})

t('sql file throws', async() =>
  ['ENOENT', (await sql.file(rel('selectomondo.sql')).catch(x => x.code))]
)

t('sql file cached', async() => {
  await sql.file(rel('select.sql'))
  await delay(20)

  return [1, (await sql.file(rel('select.sql')))[0].x]
})

t('Parameters in file', async() => {
  const result = await sql.file(
    rel('select-param.sql'),
    ['hello']
  )
  return ['hello', result[0].x]
})

t('Connection ended promise', async() => {
  const sql = postgres(options)

  await sql.end()

  return [undefined, await sql.end()]
})

t('Connection ended timeout', async() => {
  const sql = postgres(options)

  await sql.end({ timeout: 10 })

  return [undefined, await sql.end()]
})

//t('Connection ended error', async() => {
//  const sql = postgres(options)
//  await sql.end()
//  return ['CONNECTION_ENDED', (await sql``.catch(x => x.code))]
//})

t('Connection end does not cancel query', async() => {
  const sql = postgres(options)

  const promise = sql`select 1 as x`.execute()

  await sql.end()

  return [1, (await promise)[0].x]
})

//t('Connection destroyed', async() => {
//  const sql = postgres(options)
//  process.nextTick(() => sql.end({ timeout: 0 }))
//  return ['CONNECTION_DESTROYED', await sql``.catch(x => x.code)]
//})
//
//t('Connection destroyed with query before', async() => {
//  const sql = postgres(options)
//      , error = sql`select pg_sleep(0.2)`.catch(err => err.code)
//
//  sql.end({ timeout: 0 })
//  return ['CONNECTION_DESTROYED', await error]
//})

t('transform column', async() => {
  const sql = postgres({
    ...options,
    transform: { column: x => x.split('').reverse().join('') }
  })

  await sql`create table test.test (hello_world int)`
  await sql`insert into test.test values (1)`
  return ['dlrow_olleh', Object.keys((await sql`select * from test.test`)[0])[0], await sql`drop table test.test`]
})

t('column toPascal', async() => {
  const sql = postgres({
    ...options,
    transform: { column: postgres.toPascal }
  })

  await sql`create table test.test (hello_world int)`
  await sql`insert into test.test values (1)`
  return ['HelloWorld', Object.keys((await sql`select * from test.test`)[0])[0], await sql`drop table test.test`]
})

t('column toCamel', async() => {
  const sql = postgres({
    ...options,
    transform: { column: postgres.toCamel }
  })

  await sql`create table test.test (hello_world int)`
  await sql`insert into test.test values (1)`
  return ['helloWorld', Object.keys((await sql`select * from test.test`)[0])[0], await sql`drop table test.test`]
})

t('column toKebab', async() => {
  const sql = postgres({
    ...options,
    transform: { column: postgres.toKebab }
  })

  await sql`create table test.test (hello_world int)`
  await sql`insert into test.test values (1)`
  return ['hello-world', Object.keys((await sql`select * from test.test`)[0])[0], await sql`drop table test.test`]
})

t('Transform nested json in arrays', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })
  return ['aBcD', (await sql`select '[{"a_b":1},{"c_d":2}]'::jsonb as x`)[0].x.map(Object.keys).join('')]
})

t('Transform deeply nested json object in arrays', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })
  return [
    'childObj_deeplyNestedObj_grandchildObj',
    (await sql`
      select '[{"nested_obj": {"child_obj": 2, "deeply_nested_obj": {"grandchild_obj": 3}}}]'::jsonb as x
    `)[0].x.map(x => {
      let result
      for (const key in x)
        result = [...Object.keys(x[key]), ...Object.keys(x[key].deeplyNestedObj)]
      return result
    })[0]
    .join('_')
  ]
})

t('Transform deeply nested json array in arrays', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })
  return [
    'childArray_deeplyNestedArray_grandchildArray',
    (await sql`
      select '[{"nested_array": [{"child_array": 2, "deeply_nested_array": [{"grandchild_array":3}]}]}]'::jsonb AS x
    `)[0].x.map((x) => {
      let result
      for (const key in x)
        result = [...Object.keys(x[key][0]), ...Object.keys(x[key][0].deeplyNestedArray[0])]
      return result
    })[0]
    .join('_')
  ]
})

t('Bypass transform for json primitive', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })

  const x = (
    await sql`select 'null'::json as a, 'false'::json as b, '"a"'::json as c, '1'::json as d`
  )[0]

  return [
    JSON.stringify({ a: null, b: false, c: 'a', d: 1 }),
    JSON.stringify(x)
  ]
})

t('Bypass transform for jsonb primitive', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })

  const x = (
    await sql`select 'null'::jsonb as a, 'false'::jsonb as b, '"a"'::jsonb as c, '1'::jsonb as d`
  )[0]

  return [
    JSON.stringify({ a: null, b: false, c: 'a', d: 1 }),
    JSON.stringify(x)
  ]
})

t('unsafe', async() => {
  await sql`create table test.test (x int)`
  return [1, (await sql.unsafe('insert into test.test values ($1) returning *', [1]))[0].x, await sql`drop table test.test`]
})

t('unsafe simple', async() => {
  return [1, (await sql.unsafe('select 1 as x'))[0].x]
})

t('unsafe simple includes columns', async() => {
  return ['x', (await sql.unsafe('select 1 as x').values()).columns[0].name]
})

t('unsafe describe', async() => {
  const q = 'insert into test.test values (1)'
  await sql`create table test.test(a int unique)`
  await sql.unsafe(q).describe()
  const x = await sql.unsafe(q).describe()
  return [
    q,
    x.string,
    await sql`drop table test.test`
  ]
})

t('simple query using unsafe with multiple statements', async() => {
  return [
    '1,2',
    (await sql.unsafe('select 1 as x;select 2 as x')).map(x => x[0].x).join()
  ]
})

t('simple query using simple() with multiple statements', async() => {
  return [
    '1,2',
    (await sql`select 1 as x;select 2 as x`.simple()).map(x => x[0].x).join()
  ]
})

if (options.prepare) {
  t('listen and notify', async() => {
    const sql = postgres(options)
    const channel = 'hello'
    const result = await new Promise(async r => {
      await sql.listen(channel, r)
      sql.notify(channel, 'works')
    })

    return [
      'works',
      result,
      sql.end()
    ]
  })

  t('double listen', async() => {
    const sql = postgres(options)
    , channel = 'hello'

    let count = 0

    await new Promise((resolve, reject) =>
      sql.listen(channel, resolve)
      .then(() => sql.notify(channel, 'world'))
      .catch(reject)
    ).then(() => count++)

    await new Promise((resolve, reject) =>
      sql.listen(channel, resolve)
      .then(() => sql.notify(channel, 'world'))
      .catch(reject)
    ).then(() => count++)

    // for coverage
    sql.listen('weee', () => { /* noop */ }).then(sql.end)

    return [2, count]
  })

// Reason: No LISTEN/NOTIFY
//t('multiple listeners work after a reconnect', async() => {
//  const sql = postgres(options)
//      , xs = []
//
//  const s1 = await sql.listen('test', x => xs.push('1', x))
//  await sql.listen('test', x => xs.push('2', x))
//  await sql.notify('test', 'a')
//  await delay(50)
//  await sql`select pg_terminate_backend(${ s1.state.pid })`
//  await delay(200)
//  await sql.notify('test', 'b')
//  await delay(50)
//  sql.end()
//
//  return ['1a2a1b2b', xs.join('')]
//})
//
//t('listen and notify with weird name', async() => {
//  const sql = postgres(options)
//  const channel = 'wat-;.ø.§'
//  const result = await new Promise(async r => {
//    const { unlisten } = await sql.listen(channel, r)
//    sql.notify(channel, 'works')
//    await delay(50)
//    await unlisten()
//  })
//
//  return [
//    'works',
//    result,
//    sql.end()
//  ]
//})
//
//t('listen and notify with upper case', async() => {
//  const sql = postgres(options)
//  const channel = 'withUpperChar'
//  const result = await new Promise(async r => {
//    await sql.listen(channel, r)
//    sql.notify(channel, 'works')
//  })
//
//  return [
//    'works',
//    result,
//    sql.end()
//  ]
//})
//
//t('listen reconnects', { timeout: 2 }, async() => {
//  const sql = postgres(options)
//      , resolvers = {}
//      , a = new Promise(r => resolvers.a = r)
//      , b = new Promise(r => resolvers.b = r)
//
//  let connects = 0
//
//  const { state: { pid } } = await sql.listen(
//    'test',
//    x => x in resolvers && resolvers[x](),
//    () => connects++
//  )
//  await sql.notify('test', 'a')
//  await a
//  await sql`select pg_terminate_backend(${ pid })`
//  await delay(100)
//  await sql.notify('test', 'b')
//  await b
//  sql.end()
//  return [connects, 2]
//})
//
//t('listen result reports correct connection state after reconnection', async() => {
//  const sql = postgres(options)
//      , xs = []
//
//  const result = await sql.listen('test', x => xs.push(x))
//  const initialPid = result.state.pid
//  await sql.notify('test', 'a')
//  await sql`select pg_terminate_backend(${ initialPid })`
//  await delay(50)
//  sql.end()
//
//  return [result.state.pid !== initialPid, true]
//})
//
//t('unlisten removes subscription', async() => {
//  const sql = postgres(options)
//      , xs = []
//
//  const { unlisten } = await sql.listen('test', x => xs.push(x))
//  await sql.notify('test', 'a')
//  await delay(50)
//  await unlisten()
//  await sql.notify('test', 'b')
//  await delay(50)
//  sql.end()
//
//  return ['a', xs.join('')]
//})
//
//t('listen after unlisten', async() => {
//  const sql = postgres(options)
//      , xs = []
//
//  const { unlisten } = await sql.listen('test', x => xs.push(x))
//  await sql.notify('test', 'a')
//  await delay(50)
//  await unlisten()
//  await sql.notify('test', 'b')
//  await delay(50)
//  await sql.listen('test', x => xs.push(x))
//  await sql.notify('test', 'c')
//  await delay(50)
//  sql.end()
//
//  return ['ac', xs.join('')]
//})
//
//t('multiple listeners and unlisten one', async() => {
//  const sql = postgres(options)
//      , xs = []
//
//  await sql.listen('test', x => xs.push('1', x))
//  const s2 = await sql.listen('test', x => xs.push('2', x))
//  await sql.notify('test', 'a')
//  await delay(50)
//  await s2.unlisten()
//  await sql.notify('test', 'b')
//  await delay(50)
//  sql.end()
//
//  return ['1a2a1b', xs.join('')]
//})
}

// Reason: We alter these parameters for PSQL, so it will not work as expected
//t('responds with server parameters (application_name)', async() =>
//  ['postgres.js', await new Promise((resolve, reject) => postgres({
//    ...options,
//    onparameter: (k, v) => k === 'application_name' && resolve(v)
//  })`select 1`.catch(reject))]
//)
//
//t('has server parameters', async() => {
//  return ['postgres.js', (await sql`select 1`.then(() => sql.parameters.application_name))]
//})

t('big query body', { timeout: t.timeout * 2 }, async() => {
  const size = 50000
  await sql`create table test.test (x int)`
  return [size, (await sql`insert into test.test ${
    sql([...Array(size).keys()].map(x => ({ x })))
  }`).count, await sql`drop table test.test`]
})

// Reason: This tests checks internalt of the library, not the DB stuff
//ot('Throws if more than 65534 parameters', {timeout: t.timeout * 2}, async() => {
//  await sql`create table test.test (x int) -- barfoo `
//  return ['MAX_PARAMETERS_EXCEEDED', (await sql`insert into test ${
//    sql([...Array(65535).keys()].map(x => ({ x })))
//  }`.catch(e => (console.debug(e.code), e.code)))] //, await sql`drop table test -- foobar`]
//})

t('let postgres do implicit cast of unknown types', async() => {
  await sql`create table test.test (x timestamp with time zone)`
  const [{ x }] = await sql`insert into test.test values (${ new Date().toISOString() }) returning *`
  return [true, x instanceof Date, await sql`drop table test.test`]
})

t('only allows one statement', async() =>
  ['42601', await sql`select 1; select 2`.catch(e => e.code)]
)

t('await sql() throws not tagged error', async() => {
  let error
  try {
    await sql('select 1')
  } catch (e) {
    error = e.code
  }
  return ['NOT_TAGGED_CALL', error]
})

t('sql().then throws not tagged error', async() => {
  let error
  try {
    sql('select 1').then(() => { /* noop */ })
  } catch (e) {
    error = e.code
  }
  return ['NOT_TAGGED_CALL', error]
})

t('sql().catch throws not tagged error', async() => {
  let error
  try {
    await sql('select 1')
  } catch (e) {
    error = e.code
  }
  return ['NOT_TAGGED_CALL', error]
})

t('sql().finally throws not tagged error', async() => {
  let error
  try {
    sql('select 1').finally(() => { /* noop */ })
  } catch (e) {
    error = e.code
  }
  return ['NOT_TAGGED_CALL', error]
})

t('little bobby tables', async() => {
  const name = 'Robert\'); DROP TABLE students;--'

  await sql`create table test.students (name text, age int)`
  await sql`insert into test.students (name) values (${ name })`

  return [
    name, (await sql`select name from test.students`)[0].name,
    await sql`drop table test.students`
  ]
})

t('Connection errors are caught using begin()', {
  timeout: t.timeout * 2
}, async() => {
  let error
  try {
    const sql = postgres({ host: 'localhost', port: 1 })

    await sql.begin(async(sql) => {
      await sql`insert into test (label, value) values (${1}, ${2})`
    })
  } catch (err) {
    error = err
  }

  return [
    true,
    error.code === 'ECONNREFUSED' ||
    error.message === 'Connection refused (os error 61)'
  ]
})

t('dynamic table name', async() => {
  await sql`create table test.test(a int)`
  return [
    0, (await sql`select * from ${ sql('test.test') }`).count,
    await sql`drop table test.test`
  ]
})

t('dynamic schema name', async() => {
  await sql`create table test.test(a int)`
  return [
    0, (await sql`select * from ${ sql('test') }.test`).count,
    await sql`drop table test.test`
  ]
})

t('dynamic schema and table name', async() => {
  await sql`create table test.test(a int)`
  return [
    0, (await sql`select * from ${ sql('test.test') }`).count,
    await sql`drop table test.test`
  ]
})

t('dynamic column name', async() => {
  return ['!not_valid', Object.keys((await sql`select 1 as ${ sql('!not_valid') }`)[0])[0]]
})

t('dynamic select as', async() => {
  return ['2', (await sql`select ${ sql({ a: 1, b: 2 }) }`)[0].b]
})

t('dynamic select as pluck', async() => {
  return [undefined, (await sql`select ${ sql({ a: 1, b: 2 }, 'a') }`)[0].b]
})

t('dynamic insert', async() => {
  await sql`create table test.test (a int, b text)`
  const x = { a: 42, b: 'the answer' }

  return ['the answer', (await sql`insert into test.test ${ sql(x) } returning *`)[0].b, await sql`drop table test.test`]
})

t('dynamic insert pluck', async() => {
  await sql`create table test.test (a int, b text)`
  const x = { a: 42, b: 'the answer' }

  return [null, (await sql`insert into test.test ${ sql(x, 'a') } returning *`)[0].b, await sql`drop table test.test`]
})

t('dynamic in with empty array', async() => {
  await sql`create table test.test (a int)`
  await sql`insert into test.test values (1)`
  return [
    (await sql`select * from test.test where null in ${ sql([]) }`).count,
    0,
    await sql`drop table test.test`
  ]
})

t('dynamic in after insert', async() => {
  await sql`create table test.test (a int, b text)`
  const [{ x }] = await sql`
    with x as (
      insert into test.test values (1, 'hej')
      returning *
    )
    select 1 in ${ sql([1, 2, 3]) } as x from x
  `
  return [
    true, x,
    await sql`drop table test.test`
  ]
})

t('array insert', async() => {
  await sql`create table test.test (a int, b int)`
  return [2, (await sql`insert into test.test (a, b) values ${ sql([1, 2]) } returning *`)[0].b, await sql`drop table test.test`]
})

t('where parameters in()', async() => {
  await sql`create table test.test (x text)`
  await sql`insert into test.test values ('a')`
  return [
    (await sql`select * from test.test where x in ${ sql(['a', 'b', 'c']) }`)[0].x,
    'a',
    await sql`drop table test.test`
  ]
})

t('where parameters in() values before', async() => {
  return [2, (await sql`
    with rows as (
      select * from (values (1), (2), (3), (4)) as x(a)
    )
    select * from rows where a in ${ sql([3, 4]) }
  `).count]
})

t('dynamic multi row insert', async() => {
  await sql`create table test.test (a int, b text)`
  const x = { a: 42, b: 'the answer' }

  return [
    'the answer',
    (await sql`insert into test.test ${ sql([x, x]) } returning *`)[1].b, await sql`drop table test.test`
  ]
})

t('dynamic update', async() => {
  await sql`create table test.test (a int, b text)`
  await sql`insert into test.test (a, b) values (17, 'wrong')`

  return [
    'the answer',
    (await sql`update test.test set ${ sql({ a: 42, b: 'the answer' }) } returning *`)[0].b, await sql`drop table test.test`
  ]
})

t('dynamic update pluck', async() => {
  await sql`create table test.test (a int, b text)`
  await sql`insert into test.test (a, b) values (17, 'wrong')`

  return [
    'wrong',
    (await sql`update test.test set ${ sql({ a: 42, b: 'the answer' }, 'a') } returning *`)[0].b, await sql`drop table test.test`
  ]
})

t('dynamic select array', async() => {
  await sql`create table test.test (a int, b text)`
  await sql`insert into test.test (a, b) values (42, 'yay')`
  return ['yay', (await sql`select ${ sql(['a', 'b']) } from test.test`)[0].b, await sql`drop table test.test`]
})

t('dynamic returning array', async() => {
  await sql`create table test.test (a int, b text)`
  return [
    'yay',
    (await sql`insert into test.test (a, b) values (42, 'yay') returning ${ sql(['a', 'b']) }`)[0].b,
    await sql`drop table test.test`
  ]
})

t('dynamic select args', async() => {
  await sql`create table test.test (a int, b text)`
  await sql`insert into test.test (a, b) values (42, 'yay')`
  return ['yay', (await sql`select ${ sql('a', 'b') } from test.test`)[0].b, await sql`drop table test.test`]
})

t('dynamic values single row', async() => {
  const [{ b }] = await sql`
    select * from (values ${ sql(['a', 'b', 'c']) }) as x(a, b, c)
  `

  return ['b', b]
})

t('dynamic values multi row', async() => {
  const [, { b }] = await sql`
    select * from (values ${ sql([['a', 'b', 'c'], ['a', 'b', 'c']]) }) as x(a, b, c)
  `

  return ['b', b]
})

// Reason: we do not support custom connection parameters
//t('connection parameters', async() => {
//  const sql = postgres({
//    ...options,
//    connection: {
//      'some.var': 'yay'
//    }
//  })
//
//  return ['yay', (await sql`select current_setting('some.var') as x`)[0].x]
//})

t('Multiple queries', async() => {
  const sql = postgres({ ...options, max: 5 })
  return [4, (await Promise.all([
    sql`select 1`,
    sql`select 2`,
    sql`select 3`,
    sql`select 4`
  ])).length]
})

t('Multiple statements', async() =>
  [2, await sql.unsafe(`
    select 1 as x;
    select 2 as a;
  `).then(([, [x]]) => x.a)]
)

// Reason: We return different error, so that test will not work
//t('throws correct error when authentication fails', async() => {
//  const sql = postgres({
//    ...options,
//    pass: 'wrong'
//  })
//  return ['28P01', await sql`select 1`.catch(e => e.code)]
//})

t('notice', async() => {
  let notice
  const log = console.log // eslint-disable-line
  console.log = function(x) { // eslint-disable-line
    notice = x
  }

  await sql`create table if not exists test.users()`
  await sql`create table if not exists test.users()`

  console.log = log // eslint-disable-line

  return ['NOTICE', notice.severity]
})

t('notice hook', async() => {
  let notice
  const sql = postgres({
    ...options,
    onnotice: x => notice = x
  })

  await sql`create table if not exists test.users()`
  await sql`create table if not exists test.users()`

  return ['NOTICE', notice.severity]
})

t('bytea serializes and parses', async() => {
  const buf = Buffer.from('wat')

  await sql`create table test.test (x bytea)`
  await sql`insert into test.test values (${ buf })`

  return [
    buf.toString(),
    (await sql`select x from test.test`)[0].x.toString(),
    await sql`drop table test.test`
  ]
})

t('forEach', async() => {
  let result
  await sql`select 1 as x`.forEach(({ x }) => result = x)
  return [1, result]
})

t('forEach returns empty array', async() => {
  return [0, (await sql`select 1 as x`.forEach(() => { /* noop */ })).length]
})

if (process.env.PGMODE != 'transaction') {
  t('Cursor', async() => {
    const order = []
    await sql`select 1 as x union select 2 as x`.cursor(async([x]) => {
      order.push(x.x + 'a')
      await delay(100)
      order.push(x.x + 'b')
    })
    return ['1a1b2a2b', order.join('')]
  })

  t('Unsafe cursor', async() => {
    const order = []
    await sql.unsafe('select 1 as x union select 2 as x').cursor(async([x]) => {
      order.push(x.x + 'a')
      await delay(100)
      order.push(x.x + 'b')
    })
    return ['1a1b2a2b', order.join('')]
  })

  t('Cursor custom n', async() => {
    const order = []
    await sql`select * from generate_series(1,20)`.cursor(10, async(x) => {
      order.push(x.length)
    })
    return ['10,10', order.join(',')]
  })

  t('Cursor custom with rest n', async() => {
    const order = []
    await sql`select * from generate_series(1,20)`.cursor(11, async(x) => {
      order.push(x.length)
    })
    return ['11,9', order.join(',')]
  })

  t('Cursor custom with less results than batch size', async() => {
    const order = []
    await sql`select * from generate_series(1,20)`.cursor(21, async(x) => {
      order.push(x.length)
    })
    return ['20', order.join(',')]
  })

  t('Cursor cancel', async() => {
    let result
    await sql`select * from generate_series(1,10) as x`.cursor(async([{ x }]) => {
      result = x
      return sql.CLOSE
    })
    return [1, result]
  })

  t('Cursor throw', async() => {
    const order = []
    await sql`select 1 as x union select 2 as x`.cursor(async([x]) => {
      order.push(x.x + 'a')
      await delay(100)
      throw new Error('watty')
    }).catch(() => order.push('err'))
    return ['1aerr', order.join('')]
  })

  t('Cursor error', async() => [
    '42601',
    await sql`wat`.cursor(() => { /* noop */ }).catch((err) => err.code)
  ])

  t('Multiple Cursors', { timeout: t.timeout * 2 }, async() => {
    const result = []
    await sql.begin(async sql => [
      await sql`select 1 as cursor, x from generate_series(1,4) as x`.cursor(async([row]) => {
        result.push(row.x)
        await new Promise(r => setTimeout(r, 20))
      }),
      await sql`select 2 as cursor, x from generate_series(101,104) as x`.cursor(async([row]) => {
        result.push(row.x)
        await new Promise(r => setTimeout(r, 10))
      })
    ])

    return ['1,2,3,4,101,102,103,104', result.join(',')]
  })

  t('Cursor as async iterator', async() => {
    const order = []
    for await (const [x] of sql`select generate_series(1,2) as x;`.cursor()) {
      order.push(x.x + 'a')
      await delay(10)
      order.push(x.x + 'b')
    }

    return ['1a1b2a2b', order.join('')]
  })

  t('Cursor as async iterator with break', async() => {
    const order = []
    for await (const xs of sql`select generate_series(1,2) as x;`.cursor()) {
      order.push(xs[0].x + 'a')
      await delay(10)
      order.push(xs[0].x + 'b')
      break
    }

    return ['1a1b', order.join('')]
  })

  t('Async Iterator Unsafe cursor', async() => {
    const order = []
    for await (const [x] of sql.unsafe('select 1 as x union select 2 as x').cursor()) {
      order.push(x.x + 'a')
      await delay(10)
      order.push(x.x + 'b')
    }
    return ['1a1b2a2b', order.join('')]
  })

  t('Async Iterator Cursor custom n', async() => {
    const order = []
    for await (const x of sql`select * from generate_series(1,20)`.cursor(10))
    order.push(x.length)

    return ['10,10', order.join(',')]
  })

  t('Async Iterator Cursor custom with rest n', async() => {
    const order = []
    for await (const x of sql`select * from generate_series(1,20)`.cursor(11))
    order.push(x.length)

    return ['11,9', order.join(',')]
  })

  t('Async Iterator Cursor custom with less results than batch size', async() => {
    const order = []
    for await (const x of sql`select * from generate_series(1,20)`.cursor(21))
    order.push(x.length)
    return ['20', order.join(',')]
  })
}

t('Transform row', async() => {
  const sql = postgres({
    ...options,
    transform: { row: () => 1 }
  })

  return [1, (await sql`select 'wat'`)[0]]
})

t('Transform row forEach', async() => {
  let result
  const sql = postgres({
    ...options,
    transform: { row: () => 1 }
  })

  await sql`select 1`.forEach(x => result = x)

  return [1, result]
})

t('Transform value', async() => {
  const sql = postgres({
    ...options,
    transform: { value: () => 1 }
  })

  return [1, (await sql`select 'wat' as x`)[0].x]
})

t('Transform columns from', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.fromCamel
  })
  await sql`create table test.test (a_test int, b_test text)`
  await sql`insert into test.test ${ sql([{ aTest: 1, bTest: 1 }]) }`
  await sql`update test.test set ${ sql({ aTest: 2, bTest: 2 }) }`
  return [
    2,
    (await sql`select ${ sql('aTest', 'bTest') } from test.test`)[0].a_test,
    await sql`drop table test.test`
  ]
})

t('Transform columns to', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.toCamel
  })
  await sql`create table test.test (a_test int, b_test text)`
  await sql`insert into test.test ${ sql([{ a_test: 1, b_test: 1 }]) }`
  await sql`update test.test set ${ sql({ a_test: 2, b_test: 2 }) }`
  return [
    2,
    (await sql`select a_test, b_test from test.test`)[0].aTest,
    await sql`drop table test.test`
  ]
})

t('Transform columns from and to', async() => {
  const sql = postgres({
    ...options,
    transform: postgres.camel
  })
  await sql`create table test.test (a_test int, b_test text)`
  await sql`insert into test.test ${ sql([{ aTest: 1, bTest: 1 }]) }`
  await sql`update test.test set ${ sql({ aTest: 2, bTest: 2 }) }`
  return [
    2,
    (await sql`select ${ sql('aTest', 'bTest') } from test.test`)[0].aTest,
    await sql`drop table test.test`
  ]
})

t('Transform columns from and to (legacy)', async() => {
  const sql = postgres({
    ...options,
    transform: {
      column: {
        to: postgres.fromCamel,
        from: postgres.toCamel
      }
    }
  })
  await sql`create table test.test (a_test int, b_test text)`
  await sql`insert into test.test ${ sql([{ aTest: 1, bTest: 1 }]) }`
  await sql`update test.test set ${ sql({ aTest: 2, bTest: 2 }) }`
  return [
    2,
    (await sql`select ${ sql('aTest', 'bTest') } from test.test`)[0].aTest,
    await sql`drop table test.test`
  ]
})

// Reason: we do not support Unix sockets
//t('Unix socket', async() => {
//  const sql = postgres({
//    ...options,
//    host: process.env.PGSOCKET || '/tmp' // eslint-disable-line
//  })
//
//  return [1, (await sql`select 1 as x`)[0].x]
//})

t('Big result', async() => {
  return [100000, (await sql`select * from generate_series(1, 100000)`).count]
})

t('Debug', async() => {
  let result
  const sql = postgres({
    ...options,
    debug: (connection_id, str) => result = str
  })

  await sql`select 1`

  return ['select 1', result]
})

t('bigint is returned as String', async() => [
  'string',
  typeof (await sql`select 9223372036854777 as x`)[0].x
])

t('int is returned as Number', async() => [
  'number',
  typeof (await sql`select 123 as x`)[0].x
])

t('numeric is returned as string', async() => [
  'string',
  typeof (await sql`select 1.2 as x`)[0].x
])

// This test needed changes to be compatible with Bun,
// because Bun stacktraces behave differently from Node.js/deno ones
t('Async stack trace', async() => {
  const sql = postgres({ ...options, debug: false })

  const extractLine = (stackLine) => {
    const match = stackLine.match(/:(\d+)(?::|$)/)
    return match ? parseInt(match[1]) : 0
  }

  return [
    extractLine(new Error().stack.split('\n')[1]) + 1,
    await sql`error`.catch(x => {
      const lines = x.stack.split('\n')
      for (const line of lines) {
        if (line.includes('postgres/index.js') && !line.includes('native:')) {
          return extractLine(line)
        }
      }
      return extractLine(lines[lines.length - 1])
    })
  ]
})

t('Debug has long async stack trace', async() => {
  const sql = postgres({ ...options, debug: true })

  function yo() {
    return wat()
  }

  function wat() {
    return sql`error`
  }

  return [
    true,
    await yo().catch(x => {
      const stackLines = x.stack.split('\n').filter(line => line.includes('postgres/index.js'))
      return stackLines.length >= 2
    })
  ]
})

t('Error contains query string', async() => [
  'selec 1',
  (await sql`selec 1`.catch(err => err.query))
])

t('Error contains query serialized parameters', async() => [
  1,
  (await sql`selec ${ 1 }`.catch(err => err.parameters[0]))
])

t('Error contains query raw parameters', async() => [
  1,
  (await sql`selec ${ 1 }`.catch(err => err.args[0]))
])

t('Query and parameters on errorare not enumerable if debug is not set', async() => {
  const sql = postgres({ ...options, debug: false })

  return [
    false,
    (await sql`selec ${ 1 }`.catch(err => err.propertyIsEnumerable('parameters') || err.propertyIsEnumerable('query')))
  ]
})

t('Query and parameters are enumerable if debug is set', async() => {
  const sql = postgres({ ...options, debug: true })

  return [
    true,
    (await sql`selec ${ 1 }`.catch(err => err.propertyIsEnumerable('parameters') && err.propertyIsEnumerable('query')))
  ]
})

t('connect_timeout', { timeout: t.timeout * 20 }, async() => {
  const connect_timeout = 0.2
  const server = net.createServer()
  server.listen()
  const sql = postgres({ port: server.address().port, host: '127.0.0.1', connect_timeout })
  const start = Date.now()
  let end
  await sql`select 1`.catch((e) => {
    if (e.code !== 'CONNECT_TIMEOUT')
      throw e
    end = Date.now()
  })
  server.close()
  return [connect_timeout, Math.floor((end - start) / 100) / 10]
})

t('connect_timeout throws proper error', async() => [
  'CONNECT_TIMEOUT',
  await postgres({
    ...options,
    connect_timeout: 0.001
  })`select 1`.catch(e => e.code)
])

t('connect_timeout error message includes host:port', { timeout: t.timeout * 20 }, async() => {
  const connect_timeout = 0.2
  const server = net.createServer()
  server.listen()
  const sql = postgres({ port: server.address().port, host: '127.0.0.1', connect_timeout })
  const port = server.address().port
  let err
  await sql`select 1`.catch((e) => {
    if (e.code !== 'CONNECT_TIMEOUT')
      throw e
    err = e.message
  })
  server.close()
  return [['write CONNECT_TIMEOUT 127.0.0.1:', port].join(''), err]
})

// Added a skip in this test for Bun and Deno due to flakiness
//
// TODO: compare with stock Postgres to figure if it's a wider postgres.js
// issue or Supavisor hitting a corner case
t('requests works after single connect_timeout', async() => {
  if (typeof Bun !== 'undefined' || typeof Deno !== 'undefined') {
    return [true, true]
  }

  let first = true

  const sql = postgres({
    ...options,
    connect_timeout: { valueOf() { return first ? (first = false, 0.0001) : t.timeout } }
  })

  return [
    'CONNECT_TIMEOUT,,1',
    [
      await sql`select 1 as x`.then(() => 'success', x => x.code),
      await delay(10),
      (await sql`select 1 as x`)[0].x
    ].join(',')
  ]
})

t('Postgres errors are of type PostgresError', async() =>
  [true, (await sql`bad keyword`.catch(e => e)) instanceof sql.PostgresError]
)

t('Result has columns spec', async() =>
  ['x', (await sql`select 1 as x`).columns[0].name]
)

t('forEach has result as second argument', async() => {
  let x
  await sql`select 1 as x`.forEach((_, result) => x = result)
  return ['x', x.columns[0].name]
})

t('Result as arrays', async() => {
  const sql = postgres({
    ...options,
    transform: {
      row: x => Object.values(x)
    }
  })

  return ['1,2', (await sql`select 1 as a, 2 as b`)[0].join(',')]
})

t('Insert empty array', async() => {
  await sql`create table test.tester (ints int[])`
  return [
    Array.isArray((await sql`insert into test.tester (ints) values (${ sql.array([]) }) returning *`)[0].ints),
    true,
    await sql`drop table test.tester`
  ]
})

t('Insert array in sql()', async() => {
  await sql`create table test.tester (ints int[])`
  return [
    Array.isArray((await sql`insert into test.tester ${ sql({ ints: sql.array([]) }) } returning *`)[0].ints),
    true,
    await sql`drop table test.tester`
  ]
})

if (options.prepare) {
  t('Automatically creates prepared statements', async() => {
    const result = await sql`select * from pg_prepared_statements`
    return [true, result.some(x => x.name = result.statement.name)]
  })

  t('no_prepare: true disables prepared statements (deprecated)', async() => {
    const sql = postgres({ ...options, no_prepare: true })
    const result = await sql`select * from pg_prepared_statements`
    return [false, result.some(x => x.name = result.statement.name)]
  })

  t('prepare: false disables prepared statements', async() => {
    const sql = postgres({ ...options, prepare: false })
    const result = await sql`select * from pg_prepared_statements`
    return [false, result.some(x => x.name = result.statement.name)]
  })

  t('prepare: true enables prepared statements', async() => {
    const sql = postgres({ ...options, prepare: true })
    const result = await sql`select * from pg_prepared_statements`
    return [true, result.some(x => x.name = result.statement.name)]
  })

  t('prepares unsafe query when "prepare" option is true', async() => {
    const sql = postgres({ ...options, prepare: true })
    const result = await sql.unsafe('select * from pg_prepared_statements where name <> $1', ['bla'], { prepare: true })
    return [true, result.some(x => x.name = result.statement.name)]
  })

  t('does not prepare unsafe query by default', async() => {
    const sql = postgres({ ...options, prepare: true })
    const result = await sql.unsafe('select * from pg_prepared_statements where name <> $1', ['bla'])
    return [false, result.some(x => x.name = result.statement.name)]
  })

  t('Recreate prepared statements on transformAssignedExpr error', async() => {
    const insert = () => sql`insert into test.test (name) values (${ '1' }) returning name`
    await sql`create table test.test (name text)`
    await insert()
    await sql`alter table test.test alter column name type int using name::integer`
    return [
      1,
      (await insert())[0].name,
      await sql`drop table test.test`
    ]
  })
}

t('Throws correct error when retrying in transactions', async() => {
  await sql`create table test.test(x int)`
  const error = await sql.begin(sql => sql`insert into test.test (x) values (${ false })`).catch(e => e)
  return [
    error.code,
    '42804',
    sql`drop table test.test`
  ]
})

t('Recreate prepared statements on RevalidateCachedQuery error', async() => {
  const select = () => sql`select name from test.test`
  await sql`create table test.test (name text)`
  await sql`insert into test.test values ('1')`
  await select()
  await sql`alter table test.test alter column name type int using name::integer`
  return [
    1,
    (await select())[0].name,
    await sql`drop table test.test`
  ]
})

t('Properly throws routine error on not prepared statements', async() => {
  await sql`create table test.x (x text[])`
  const { routine } = await sql.unsafe(`
    insert into test.x(x) values (('a', 'b'))
  `).catch(e => e)

  return ['transformAssignedExpr', routine, await sql`drop table test.x`]
})

t('Properly throws routine error on not prepared statements in transaction', async() => {
  const { routine } = await sql.begin(sql => [
    sql`create table test.x (x text[])`,
    sql`insert into test.x(x) values (('a', 'b'))`
  ]).catch(e => e)

  return ['transformAssignedExpr', routine]
})

t('Properly throws routine error on not prepared statements using file', async() => {
  const { routine } = await sql.unsafe(`
    create table test.x (x text[]);
    insert into test.x(x) values (('a', 'b'));
  `, { prepare: true }).catch(e => e)

  return ['transformAssignedExpr', routine]
})

t('Catches connection config errors', async() => {
  const sql = postgres({ ...options, user: { toString: () => { throw new Error('wat') } }, database: 'prut' })

  return [
    'wat',
    await sql`select 1`.catch((e) => e.message)
  ]
})

t('Catches connection config errors with end', async() => {
  const sql = postgres({ ...options, user: { toString: () => { throw new Error('wat') } }, database: 'prut' })

  return [
    'wat',
    await sql`select 1`.catch((e) => e.message),
    await sql.end()
  ]
})

// Reason: It tests internals of the library, not DB connection
//nt('Catches query format errors', async() => [
//  'wat',
//  await sql.unsafe({ toString: () => { throw new Error('wat') } }).catch((e) => e.message)
//])

// Reason: single host only
//t('Multiple hosts', {
//  timeout: 1
//}, async() => {
//  const s1 = postgres({ idle_timeout })
//      , s2 = postgres({ idle_timeout, port: 5433 })
//      , sql = postgres('postgres://localhost:5432,localhost:5433', { idle_timeout, max: 1 })
//      , result = []
//
//  const id1 = (await s1`select system_identifier as x from pg_control_system()`)[0].x
//  const id2 = (await s2`select system_identifier as x from pg_control_system()`)[0].x
//
//  const x1 = await sql`select 1`
//  result.push((await sql`select system_identifier as x from pg_control_system()`)[0].x)
//  await s1`select pg_terminate_backend(${ x1.state.pid }::int)`
//  await delay(50)
//
//  const x2 = await sql`select 1`
//  result.push((await sql`select system_identifier as x from pg_control_system()`)[0].x)
//  await s2`select pg_terminate_backend(${ x2.state.pid }::int)`
//  await delay(50)
//
//  result.push((await sql`select system_identifier as x from pg_control_system()`)[0].x)
//
//  return [[id1, id2, id1].join(','), result.join(',')]
//})

t('Escaping supports schemas and tables', async() => {
  await sql`create schema a`
  await sql`create table a.b (c int)`
  await sql`insert into a.b (c) values (1)`
  return [
    1,
    (await sql`select ${ sql('a.b.c') } from a.b`)[0].c,
    await sql`drop table a.b`,
    await sql`drop schema a`
  ]
})

t('Raw method returns rows as arrays', async() => {
  const [x] = await sql`select 1`.raw()
  return [
    Array.isArray(x),
    true
  ]
})

t('Raw method returns values unparsed as Buffer', async() => {
  const [[x]] = await sql`select 1`.raw()
  return [
    x instanceof Uint8Array,
    true
  ]
})

t('Array returns rows as arrays of columns', async() => {
  return [(await sql`select 1`.values())[0][0], 1]
})

t('Copy read', async() => {
  const result = []

  await sql`create table test.test (x int)`
  await sql`insert into test.test select * from generate_series(1,10)`
  const readable = await sql`copy test.test to stdout`.readable()
  readable.on('data', x => result.push(x))
  await new Promise(r => readable.on('end', r))

  return [
    result.length,
    10,
    await sql`drop table test.test`
  ]
})

t('Copy write', { timeout: t.timeout * 2 }, async() => {
  await sql`create table test.test (x int)`
  const writable = await sql`copy test.test from stdin`.writable()

  writable.write('1\n')
  writable.write('1\n')
  writable.end()

  await new Promise(r => writable.on('finish', r))

  return [
    (await sql`select 1 from test.test`).length,
    2,
    await sql`drop table test.test`
  ]
})

t('Copy write as first', async() => {
  await sql`create table test.test (x int)`
  const first = postgres(options)
  const writable = await first`COPY test.test FROM STDIN WITH(FORMAT csv, HEADER false, DELIMITER ',')`.writable()
  writable.write('1\n')
  writable.write('1\n')
  writable.end()

  await new Promise(r => writable.on('finish', r))

  return [
    (await sql`select 1 from test.test`).length,
    2,
    await sql`drop table test.test`
  ]
})

t('Copy from file', async() => {
  await sql`create table test.test (x int, y int, z int)`
  await new Promise(async r => fs
    .createReadStream(rel('copy.csv'))
    .pipe(await sql`copy test.test from stdin`.writable())
    .on('finish', r)
  )

  return [
    JSON.stringify(await sql`select * from test.test`),
    '[{"x":1,"y":2,"z":3},{"x":4,"y":5,"z":6}]',
    await sql`drop table test.test`
  ]
})

t('Copy from works in transaction', async() => {
  await sql`create table test.test(x int)`
  const xs = await sql.begin(async sql => {
    (await sql`copy test.test from stdin`.writable()).end('1\n2')
    await delay(20)
    return sql`select 1 from test.test`
  })

  return [
    xs.length,
    2,
    await sql`drop table test.test`
  ]
})

t('Copy from abort', async() => {
  const sql = postgres(options)
  const readable = fs.createReadStream(rel('copy.csv'))

  await sql`create table test.test (x int, y int, z int)`
  await sql`TRUNCATE TABLE test.test`

  const writable = await sql`COPY test.test FROM STDIN`.writable()

  let aborted

  readable
    .pipe(writable)
    .on('error', (err) => aborted = err)

  writable.destroy(new Error('abort'))
  await sql.end()

  return [
    'abort',
    aborted.message,
    await postgres(options)`drop table test.test`
  ]
})

t('multiple queries before connect', async() => {
  const sql = postgres({ ...options, max: 2 })
  const xs = await Promise.all([
    sql`select 1 as x`,
    sql`select 2 as x`,
    sql`select 3 as x`,
    sql`select 4 as x`
  ])

  return [
    '1,2,3,4',
    xs.map(x => x[0].x).join()
  ]
})

// Reason: No subscriptions, use Supabase Realtime
//t('subscribe', { timeout: 2 }, async() => {
//  const sql = postgres({
//    database: 'postgres',
//    publications: 'alltables'
//  })
//
//  await sql.unsafe('create publication alltables for all tables')
//
//  const result = []
//
//  const { unsubscribe } = await sql.subscribe('*', (row, { command, old }) => {
//    result.push(command, row.name, row.id, old && old.name, old && old.id)
//  })
//
//  await sql`
//    create table test.test (
//      id serial primary key,
//      name text
//    )
//  `
//
//  await sql`alter table test replica identity default`
//  await sql`insert into test (name) values ('Murray')`
//  await sql`update test set name = 'Rothbard'`
//  await sql`update test set id = 2`
//  await sql`delete from test`
//  await sql`alter table test replica identity full`
//  await sql`insert into test (name) values ('Murray')`
//  await sql`update test set name = 'Rothbard'`
//  await sql`delete from test`
//  await delay(10)
//  await unsubscribe()
//  await sql`insert into test (name) values ('Oh noes')`
//  await delay(10)
//  return [
//    'insert,Murray,1,,,update,Rothbard,1,,,update,Rothbard,2,,1,delete,,2,,,insert,Murray,2,,,update,Rothbard,2,Murray,2,delete,Rothbard,2,,', // eslint-disable-line
//    result.join(','),
//    await sql`drop table test`,
//    await sql`drop publication alltables`,
//    await sql.end()
//  ]
//})
//
//t('subscribe with transform', { timeout: 2 }, async() => {
//  const sql = postgres({
//    transform: {
//      column: {
//        from: postgres.toCamel,
//        to: postgres.fromCamel
//      }
//    },
//    database: 'postgres',
//    publications: 'alltables'
//  })
//
//  await sql.unsafe('create publication alltables for all tables')
//
//  const result = []
//
//  const { unsubscribe } = await sql.subscribe('*', (row, { command, old }) =>
//    result.push(command, row.nameInCamel || row.id, old && old.nameInCamel)
//  )
//
//  await sql`
//    create table test.test (
//      id serial primary key,
//      name_in_camel text
//    )
//  `
//
//  await sql`insert into test (name_in_camel) values ('Murray')`
//  await sql`update test set name_in_camel = 'Rothbard'`
//  await sql`delete from test`
//  await sql`alter table test replica identity full`
//  await sql`insert into test (name_in_camel) values ('Murray')`
//  await sql`update test set name_in_camel = 'Rothbard'`
//  await sql`delete from test`
//  await delay(10)
//  await unsubscribe()
//  await sql`insert into test (name_in_camel) values ('Oh noes')`
//  await delay(10)
//  return [
//    'insert,Murray,,update,Rothbard,,delete,1,,insert,Murray,,update,Rothbard,Murray,delete,Rothbard,',
//    result.join(','),
//    await sql`drop table test`,
//    await sql`drop publication alltables`,
//    await sql.end()
//  ]
//})
//
//t('subscribe reconnects and calls onsubscribe', { timeout: 4 }, async() => {
//  const sql = postgres({
//    database: 'postgres',
//    publications: 'alltables',
//    fetch_types: false
//  })
//
//  await sql.unsafe('create publication alltables for all tables')
//
//  const result = []
//  let onsubscribes = 0
//
//  const { unsubscribe, sql: subscribeSql } = await sql.subscribe(
//    '*',
//    (row, { command, old }) => result.push(command, row.name || row.id, old && old.name),
//    () => onsubscribes++
//  )
//
//  await sql`
//    create table test.test (
//      id serial primary key,
//      name text
//    )
//  `
//
//  await sql`insert into test (name) values ('Murray')`
//  await delay(10)
//  await subscribeSql.close()
//  await delay(500)
//  await sql`delete from test`
//  await delay(100)
//  await unsubscribe()
//  return [
//    '2insert,Murray,,delete,1,',
//    onsubscribes + result.join(','),
//    await sql`drop table test`,
//    await sql`drop publication alltables`,
//    await sql.end()
//  ]
//})

t('Execute', async() => {
  const result = await new Promise((resolve) => {
    const sql = postgres({ ...options, fetch_types: false, debug:(id, query) => resolve(query) })
    sql`select 1`.execute()
  })

  return [result, 'select 1']
})

t('Cancel running query', async() => {
  const query = sql`select pg_sleep(2)`
  setTimeout(() => query.cancel(), 500)
  const error = await query.catch(x => x)
  return ['57014', error.code]
})

t('Cancel piped query', { timeout: t.timeout * 2 }, async() => {
  const sql = postgres({...options, max: 2})
  await sql`select 1`
  const last = sql`select pg_sleep(1)`.execute()
  const query = sql`select pg_sleep(2) as dig`
  setTimeout(() => query.cancel(), 500)
  const error = await query.catch(x => x)
  await last
  return ['57014', error.code]
})

t('Cancel queued query', async() => {
  const query = sql`select pg_sleep(2) as nej`
  const tx = sql.begin(sql => (
    query.cancel(),
    sql`select pg_sleep(0.5) as hej, 'hejsa'`
  ))
  const error = await query.catch(x => x)
  await tx
  return ['57014', error.code]
})

t('Fragments', async() => [
  1,
  (await sql`
    ${ sql`select` } 1 as x
  `)[0].x
])

t('Result becomes array', async() => [
  true,
  (await sql`select 1`).slice() instanceof Array
])

t('Describe', async() => {
  const type = (await sql`select ${ 1 }::int as x`.describe()).types[0]
  return [23, type]
})

t('Describe a statement', async() => {
  await sql`create table test.tester (name text, age int)`
  const r = await sql`select name, age from test.tester where name like $1 and age > $2`.describe()
  return [
    '25,23/name:25,age:23',
    `${ r.types.join(',') }/${ r.columns.map(c => `${c.name}:${c.type}`).join(',') }`,
    await sql`drop table test.tester`
  ]
})

t('Include table oid and column number in column details', async() => {
  await sql`create table test.tester (name text, age int)`
  const r = await sql`select name, age from test.tester where name like $1 and age > $2`.describe()
  const [{ oid }] = await sql`select oid from pg_class where relname = 'tester'`

  return [
    `table:${oid},number:1|table:${oid},number:2`,
    `${ r.columns.map(c => `table:${c.table},number:${c.number}`).join('|') }`,
    await sql`drop table test.tester`
  ]
})

t('Describe a statement without parameters', async() => {
  await sql`create table test.tester (name text, age int)`
  const r = await sql`select name, age from test.tester`.describe()
  return [
    '0,2',
    `${ r.types.length },${ r.columns.length }`,
    await sql`drop table test.tester`
  ]
})

t('Describe a statement without columns', async() => {
  await sql`create table test.tester (name text, age int)`
  const r = await sql`insert into test.tester (name, age) values ($1, $2)`.describe()
  return [
    '2,0',
    `${ r.types.length },${ r.columns.length }`,
    await sql`drop table test.tester`
  ]
})

t('Large object', async() => {
  const file = rel('index.js')
      , md5 = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')

  const lo = await sql.largeObject()
  await new Promise(async r => fs.createReadStream(file).pipe(await lo.writable()).on('finish', r))
  await lo.seek(0)

  const out = crypto.createHash('md5')
  await new Promise(r => lo.readable().then(x => x.on('data', x => out.update(x)).on('end', r)))

  return [
    md5,
    out.digest('hex'),
    await lo.close()
  ]
})

t('Catches type serialize errors', async() => {
  const sql = postgres({
    ...options,
    idle_timeout,
    types: {
      text: {
        from: 25,
        to: 25,
        parse: x => x,
        serialize: () => { throw new Error('watSerialize') }
      }
    }
  })

  return [
    'watSerialize',
    (await sql`select ${ 'wat' }`.catch(e => e.message))
  ]
})

t('Catches type parse errors', async() => {
  const sql = postgres({
    ...options,
    idle_timeout,
    types: {
      text: {
        from: 25,
        to: 25,
        parse: () => { throw new Error('watParse') },
        serialize: x => x
      }
    }
  })

  return [
    'watParse',
    (await sql`select 'wat'`.catch(e => e.message))
  ]
})

t('Catches type serialize errors in transactions', async() => {
  const sql = postgres({
    ...options,
    idle_timeout,
    types: {
      text: {
        from: 25,
        to: 25,
        parse: x => x,
        serialize: () => { throw new Error('watSerialize') }
      }
    }
  })

  return [
    'watSerialize',
    (await sql.begin(sql => (
      sql`select 1`,
      sql`select ${ 'wat' }`
    )).catch(e => e.message))
  ]
})

t('Catches type parse errors in transactions', async() => {
  const sql = postgres({
    ...options,
    idle_timeout,
    types: {
      text: {
        from: 25,
        to: 25,
        parse: () => { throw new Error('watParse') },
        serialize: x => x
      }
    }
  })

  return [
    'watParse',
    (await sql.begin(sql => (
      sql`select 1`,
      sql`select 'wat'`
    )).catch(e => e.message))
  ]
})

t('Prevent premature end of connection in transaction', async() => {
  const sql = postgres({...options, max_lifetime: 0.01, idle_timeout })
  const result = await sql.begin(async sql => {
    await sql`select 1`
    await delay(20)
    await sql`select 1`
    return 'yay'
  })


  return [
    'yay',
    result
  ]
})

t('Ensure reconnect after max_lifetime with transactions', { timeout: t.timeout * 5 }, async() => {
  const sql = postgres({
    ...options,
    max_lifetime: 0.01,
    idle_timeout,
    max: 1
  })

  let x = 0
  while (x++ < 10) await sql.begin(sql => sql`select 1 as x`)

  return [true, true]
})


//t('Ensure transactions throw if connection is closed while there is no query', async() => {
//  const sql = postgres(options)
//  const x = await sql.begin(async() => {
//    setTimeout(() => sql.end({ timeout: 0 }), 10)
//    await new Promise(r => setTimeout(r, 200))
//    return sql`select 1`
//  }).catch(x => x)
//  return ['CONNECTION_CLOSED', x.code]
//})

// Reason: Irrelevant to us, if user wants to use custom socket, it is up to
// them to make it work.
//
//t('Custom socket', {}, async() => {
//  let result
//  const sql = postgres({
//    ...options,
//    socket: () => new Promise((resolve, reject) => {
//      const socket = new net.Socket()
//      socket.connect(options.port)
//      socket.once('data', x => result = x[0])
//      socket.on('error', reject)
//      socket.on('connect', () => resolve(socket))
//    }),
//    idle_timeout
//  })
//
//  await sql`select 1`
//
//  return [
//    result,
//    82
//  ]
//})

t('Ensure drain only dequeues if ready', async() => {
  const sql = postgres(options)

  const res = await Promise.all([
    sql.unsafe('SELECT 0+$1 --' + '.'.repeat(100000), [1]),
    sql.unsafe('SELECT 0+$1+$2+$3', [1, 2, 3])
  ])

  return [res.length, 2]
})

t('Supports fragments as dynamic parameters', async() => {
  await sql`create table test.test (a int, b bool)`
  await sql`insert into test.test values(1, true)`
  await sql`insert into test.test ${
    sql({
      a: 2,
      b: sql`exists(select 1 from test.test where b = ${ true })`
    })
  }`

  return [
    '1,t2,t',
    (await sql`select * from test.test`.raw()).join(''),
    await sql`drop table test.test`
  ]
})

t('Supports nested fragments with parameters', async() => {
  await sql`create table test.test ${
    sql`(${ sql('a') } ${ sql`int` })`
  }`
  await sql`insert into test.test values(1)`
  return [
    1,
    (await sql`select a from test.test`)[0].a,
    await sql`drop table test.test`
  ]
})

t('Supports multiple nested fragments with parameters', async() => {
  const [{ b }] = await sql`select * ${
    sql`from ${
      sql`(values (2, ${ 1 }::int)) as x(${ sql(['a', 'b']) })`
    }`
  }`
  return [
    1,
    b
  ]
})

t('Supports arrays of fragments', async() => {
  const [{ x }] = await sql`
    ${ [sql`select`, sql`1`, sql`as`, sql`x`] }
  `

  return [
    1,
    x
  ]
})

t('Does not try rollback when commit errors', async() => {
  let notice = null
  const sql = postgres({ ...options, onnotice: x => notice = x })
  await sql`create table test.test(x int constraint test_constraint unique deferrable initially deferred)`

  await sql.begin('isolation level serializable', async sql => {
    await sql`insert into test.test values(1)`
    await sql`insert into test.test values(1)`
  }).catch(e => e)

  return [
    notice,
    null,
    await sql`drop table test.test`
  ]
})

t('Last keyword used even with duplicate keywords', async() => {
  await sql`create table test.test (x int)`
  await sql`insert into test.test values(1)`
  const [{ x }] = await sql`
    select
      1 in (1) as x
    from test.test
    where x in ${ sql([1, 2]) }
  `

  return [x, true, await sql`drop table test.test`]
})

t('Insert array with null', async() => {
  await sql`create table test.test (x int[])`
  await sql`insert into test.test ${ sql({ x: [1, null, 3] }) }`
  return [
    1,
    (await sql`select x from test.test`)[0].x[0],
    await sql`drop table test.test`
  ]
})

t('Insert array with undefined throws', async() => {
  await sql`create table test.test (x int[])`
  return [
    'UNDEFINED_VALUE',
    await sql`insert into test.test ${ sql({ x: [1, undefined, 3] }) }`.catch(e => e.code),
    await sql`drop table test.test`
  ]
})

t('Insert array with undefined transform', async() => {
  const sql = postgres({ ...options, transform: { undefined: null } })
  await sql`create table test.test (x int[])`
  await sql`insert into test.test ${ sql({ x: [1, undefined, 3] }) }`
  return [
    1,
    (await sql`select x from test.test`)[0].x[0],
    await sql`drop table test.test`
  ]
})

t('concurrent cursors', async() => {
  const xs = []

  await Promise.all([...Array(7)].map((x, i) => [
    sql`select ${ i }::int as a, generate_series(1, 2) as x`.cursor(([x]) => xs.push(x.a + x.x))
  ]).flat())

  return ['12233445566778', xs.join('')]
})

t('concurrent cursors multiple connections', async() => {
  const sql = postgres({ ...options, max: 2 })
  const xs = []

  await Promise.all([...Array(7)].map((x, i) => [
    sql`select ${ i }::int as a, generate_series(1, 2) as x`.cursor(([x]) => xs.push(x.a + x.x))
  ]).flat())

  return ['12233445566778', xs.sort().join('')]
})

t('Pipelines many queries on a single connection', { timeout: t.timeout * 4 }, async() => {
  // Force prepared statements so postgres.js pipelines the statements.
  const pipe = postgres({ ...options, prepare: true, max: 1 })
  try {
    const n = 20
    const rows = await Promise.all(
      Array.from({ length: n }, (_, i) => pipe`select ${ i }::int as x`)
    )
    return [n, rows.filter((r, i) => r[0].x === i).length]
  } finally {
    await pipe.end()
  }
})

if (process.env.PGMODE != 'transaction') {
  t('reserve connection', async() => {
    const reserved = await sql.reserve()

    setTimeout(() => reserved.release(), 510)

    const xs = await Promise.all([
      reserved`select 1 as x`.then(([{ x }]) => ({ time: Date.now(), x })),
      sql`select 2 as x`.then(([{ x }]) => ({ time: Date.now(), x })),
      reserved`select 3 as x`.then(([{ x }]) => ({ time: Date.now(), x }))
    ])

    if (xs[1].time - xs[2].time < 500)
      throw new Error('Wrong time')

    return [
      '123',
      xs.map(x => x.x).join('')
    ]
  })
}

t('arrays in reserved connection', async() => {
  const reserved = await sql.reserve()
  const [{ x }] = await reserved`select array[1, 2, 3] as x`
  reserved.release()

  return [
    '123',
    x.join('')
  ]
})
