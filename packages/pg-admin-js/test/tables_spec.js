var assert = require('assert')
var tables = require('../src/api/tables.js')

describe('Tables', function() {
  it('getAll() should return an array of tables', async () => {
    let allTables = await tables.getAll()
    assert(Array.isArray(allTables))
  })
})
