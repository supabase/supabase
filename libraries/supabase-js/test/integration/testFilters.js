import { assert } from 'chai'
import { createClient } from '../../src'

describe('test reading from the rest interface', () => {
  const supabase = createClient('http://localhost:8000', 'examplekey')
  const expectedQueryArray = [
    'name=eq.New Zealand',
    'id=gt.20',
    'id=lt.20',
    'id=gte.20',
    'id=lte.20',
    'name=like.*United*',
    'name=ilike.*United*',
    'name=is.null',
    'name=in.(China,France)',
    'name=neq.China',
    'countries=cs.{China,France}',
    'countries=cd.{China,France}',
    'allies=ov.{China,France}',
    'population_range=ov.(100,500)',
    'population_range=sl.(100,500)',
    'population_range=sr.(100,500)',
    'population_range=nxl.(100,500)',
    'population_range=nxr.(100,500)',
    'population_range=adj.(100,500)',
  ]

  it('should be able to take in filters before an actual request is made', async () => {
    const response = supabase
      .from('countries')
      .eq('name', 'New Zealand')
      .gt('id', 20)
      .lt('id', 20)
      .gte('id', 20)
      .lte('id', 20)
      .like('name', '%United%')
      .ilike('name', '%United%')
      .is('name', null)
      .in('name', ['China', 'France'])
      .neq('name', 'China')
      .cs('countries', ['China', 'France'])
      .cd('countries', ['China', 'France'])
      .ova('allies', ['China', 'France'])
      .ovr('population_range', [100, 500])
      .sl('population_range', [100, 500])
      .sr('population_range', [100, 500])
      .nxl('population_range', [100, 500])
      .nxr('population_range', [100, 500])
      .adj('population_range', [100, 500])
      .select('*')

    assert.deepEqual(response._query, expectedQueryArray)
  })

  it('should be able to take in filters after an actual request is made', async () => {
    const response = supabase
      .from('countries')
      .select('*')
      .eq('name', 'New Zealand')
      .gt('id', 20)
      .lt('id', 20)
      .gte('id', 20)
      .lte('id', 20)
      .like('name', '%United%')
      .ilike('name', '%United%')
      .is('name', null)
      .in('name', ['China', 'France'])
      .neq('name', 'China')
      .cs('countries', ['China', 'France'])
      .cd('countries', ['China', 'France'])
      .ova('allies', ['China', 'France'])
      .ovr('population_range', [100, 500])
      .sl('population_range', [100, 500])
      .sr('population_range', [100, 500])
      .nxl('population_range', [100, 500])
      .nxr('population_range', [100, 500])
      .adj('population_range', [100, 500])

    assert.deepEqual(response._query, expectedQueryArray)
  })
})
