import assert from 'assert'
import * as views from '../src/api/views.js'
import { compareKeys } from './_helpers'

describe('Views', function() {
  it('getAll() should return an array of tables', async () => {
    let res = await views.getAll({}, { schema: 'information_schema' })

    // Check that we have a result
    assert(Array.isArray(res))

    // Compare one of the values
    const valid = {
      table_schema: 'information_schema',
      table_name: 'attributes',
      check_option: 'NONE',
      is_updatable: 'NO',
      is_insertable_into: 'NO',
      is_trigger_updatable: 'NO',
      is_trigger_deletable: 'NO',
      is_trigger_insertable_into: 'NO',
    }
    const compare = res.find(setting => setting.name === valid.name)
    compareKeys(valid, compare)
  })
})
