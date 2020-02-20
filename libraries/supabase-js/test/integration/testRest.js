import { assert } from 'chai'
import { createClient } from '../../src'

// from()
// select()
// order()
// range()
// single()
// filter()
// match()
// gt()
// lt()
// gte()
// lte()
// like()
// ilike()
// is()
// in()
// not()
describe('test reading from the rest interface', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')

  it('from() and select()', async () => {
    const response = await supabase.from('users').select()
    assert(response.body[3].status === 'ONLINE', 'should return 4 records with all columns')
  })

  it('order()', async () => {
    const response = await supabase
      .from('users')
      .select('*')
      .order('id', false, false)
    assert(response.body[0].id === 4, 'id should equal 4, since order is descending')
  })

  it('range()', async () => {
    const response = await supabase
      .from('users')
      .select('*')
      .range(0, 3)
    assert(response.body[3].id === 4, 'last item should be id 4')
    assert(response.body[0].id === 1, 'first item should be id 1')
  })

  it('single()', async () => {
    const response = await supabase
      .from('users')
      .eq('id', '3')
      .select('*')
      .single()
    assert(response.body.id === 3, 'single should return one result as an object not an array')
  })

  it('filter()', async () => {
    const response = await supabase
      .from('users')
      .filter('id', 'lte', 3)
      .filter('username', 'in', ['awalias', 'supabot'])
      .select('*')
    assert(response.body.length === 2, 'should return two records, awalias, and supabot')
  })

  it('match()', async () => {
    const response = await supabase
      .from('users')
      .match({ username: 'awalias' })
      .select('*')
    assert(response.body.length === 1, 'should return one record')
    assert(response.body[0].username == 'awalias', 'should return one record, awalias')
  })

  it('eq()', async () => {
    const response = await supabase
      .from('users')
      .eq('username', 'supabot')
      .select('id')
    assert(response.body[0].id === 1, 'id should equal 1')
  })

  it('lt()', async () => {
    const response = await supabase
      .from('users')
      .lt('id', '3')
      .select('*')
    assert(response.body.length === 2, 'should be 2 members with id less than 3')
  })

  it('lte()', async () => {
    const response = await supabase
      .from('users')
      .lte('id', '3')
      .select('*')
    assert(response.body.length === 3, 'should be 3 members with id less than or equal to 3')
  })

  it('gt()', async () => {
    const response = await supabase
      .from('users')
      .gt('id', '3')
      .select('*')
    assert(response.body.length === 1, 'should be 1 members with id greater than 3')
  })

  it('gte()', async () => {
    const response = await supabase
      .from('users')
      .gte('id', '3')
      .select('*')
    assert(response.body.length === 2, 'should be 2 members with id equal to or greater than 3')
  })

  it('like()', async () => {
    const response = await supabase
      .from('users')
      .like('username', '%upAbo%')
      .select('*')
    assert(response.body.length === 0, 'should be 2 members with id equal to or greater than 3')
  })

  it('ilike()', async () => {
    const response = await supabase
      .from('users')
      .ilike('username', '%upabo%')
      .select('*')
    assert(response.body.length === 1, 'should be 2 members with id equal to or greater than 3')
  })

  it('is()', async () => {
    const response = await supabase
      .from('users')
      .is('data', null)
      .select('*')
    assert(response.body.length === 4, 'should be 4 members')
  })

  it('in()', async () => {
    const response = await supabase
      .from('users')
      .in('id', [2, 3])
      .select('*')
    assert(response.body[0].id === 2, 'first item should be id 2')
    assert(response.body[1].id === 3, 'last (and second) item should be id 3')
  })

  it('not()', async () => {
    const response = await supabase
      .from('users')
      .not('id', '3')
      .select('*')
    assert(response.body.length === 3, 'should be all except id 3')
  })
})
