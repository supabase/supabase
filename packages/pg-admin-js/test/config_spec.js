import assert from 'assert'
import * as config from '../src/api/config.js'
import { compareKeys } from './_helpers'

describe('Config', function() {
  it('getAll() should return all settings', async () => {
    let res = await config.getAll()

    // Check that we have a result
    assert(Array.isArray(res))

    // Compare one of the values
    const valid = {
      name: 'autovacuum',
      setting: 'on',
      unit: null,
      category: 'Autovacuum',
      short_desc: 'Starts the autovacuum subprocess.',
      extra_desc: null,
      context: 'sighup',
      vartype: 'bool',
      source: 'default',
      min_val: null,
      max_val: null,
      enumvals: null,
      boot_val: 'on',
      reset_val: 'on',
      sourcefile: null,
      sourceline: null,
      pending_restart: false,
    }
    const compare = res.find(setting => setting.name === valid.name)
    compareKeys(valid, compare)
  })
})
