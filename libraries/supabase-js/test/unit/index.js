import doctest from '@supabase/doctest-js'
const { createClient } = require('../../src/index.js')

describe('Doctests', () => {
  // file paths are relative to root of directory
  doctest('src/utils/ChangeMapper.js')
  doctest('src/index.js', { instance: new createClient('https://test.supabase.co', 'abc-def') })
})