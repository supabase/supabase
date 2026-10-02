import { getCancelTarget } from './cancellation'

describe('getCancelTarget', () => {
  it('uses direct client host and port for TCP cancel connections', () => {
    expect(getCancelTarget({ host: 'db.example.test', port: 6432 })).toEqual({
      type: 'tcp',
      host: 'db.example.test',
      port: 6432,
    })
  })

  it('falls back to connection parameters for TCP cancel connections', () => {
    expect(
      getCancelTarget({
        connectionParameters: { host: 'pool.example.test', port: 5433 },
      })
    ).toEqual({
      type: 'tcp',
      host: 'pool.example.test',
      port: 5433,
    })
  })

  it('uses the first connection-parameter host for multi-host TCP cancel connections', () => {
    expect(
      getCancelTarget({
        connectionParameters: {
          host: ['primary.example.test', 'standby.example.test'],
          port: 5433,
        },
      })
    ).toEqual({
      type: 'tcp',
      host: 'primary.example.test',
      port: 5433,
    })
  })

  it('uses localhost and the default postgres port when no target is exposed', () => {
    expect(getCancelTarget({})).toEqual({
      type: 'tcp',
      host: 'localhost',
      port: 5432,
    })
  })

  it('builds a Unix socket path from direct client connection fields', () => {
    expect(getCancelTarget({ host: '/var/run/postgresql', port: 6432 })).toEqual({
      type: 'socket',
      path: '/var/run/postgresql/.s.PGSQL.6432',
    })
  })

  it('prefers direct client fields over connection parameter fallbacks', () => {
    expect(
      getCancelTarget({
        host: '/tmp/pg',
        port: 6543,
        connectionParameters: { host: 'pool.example.test', port: 5433 },
      })
    ).toEqual({
      type: 'socket',
      path: '/tmp/pg/.s.PGSQL.6543',
    })
  })
})
