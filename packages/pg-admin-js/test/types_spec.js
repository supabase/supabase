import assert from 'assert'
import * as types from '../src/api/types.js'
import { compareKeys } from './_helpers'

describe('Types', function() {
  it('getAll() should return an array of tables', async () => {
    let res = await types.getAll('public')

    // Check that we have a result
    assert(Array.isArray(res))

    // Compare one of the values
    const valid = {
      name: 'smallint',
      internal_name: 'int2',
      size: '2',
      enums: '{}',
      description: '-32 thousand to 32 thousand, 2-byte storage',
    }
    const compare = res.find(setting => setting.name === valid.name)
    compareKeys(valid, compare)
  })
})
