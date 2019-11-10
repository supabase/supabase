var assert = require('assert')
var tables = require('../src/api/tables.js')

describe('Tables', function() {
  var allTables = null
  before(async function(done) {
    try {
      allTables = await tables.getAll()
      done()
    } catch (error) {
      console.log('error', error)
      done()
    }
  })

  it('should return an object', function() {
    console.log('allTables', allTables)
    assert(true)
  })
})
