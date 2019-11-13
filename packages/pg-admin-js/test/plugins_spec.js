import assert from 'assert'
import * as types from '../src/api/plugins'
import { compareKeys } from './_helpers'

describe('Plugins', function() {
  it('getAll() should return an array of tables', async () => {
    let res = await types.getAll('public')

    // Check that we have a result
    assert(Array.isArray(res))

    // Compare one of the values
    const valid = {
      name: 'plpgsql',
      version: '1.0',
      schema: 'pg_catalog',
      description: 'PL/pgSQL procedural language',
    }
    const compare = res.find(setting => setting.name === valid.name)
    compareKeys(valid, compare)
  })
})
