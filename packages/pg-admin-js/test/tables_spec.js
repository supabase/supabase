import assert from 'assert'
import * as tables from '../src/api/tables.js'

describe('Tables', function() {
  it('getAll() should return an array of tables', async () => {
    let res = await tables.getAll()

    // Check that we have a result
    assert(Array.isArray(res))
  })
})
