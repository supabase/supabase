import { sanitizeRoute } from 'components/layouts/AppLayout/ProjectDropdown'

test('Should sanitize project routes correctly when switching projects by removing project specific parameters', () => {
  expect(sanitizeRoute('/project/[ref]', { ref: 'abc' })).toBe('/project/[ref]')
  expect(sanitizeRoute('/project/[ref]/editor', { ref: 'abc' })).toBe('/project/[ref]/editor')
  expect(sanitizeRoute('/project/[ref]/storage/buckets', { ref: 'abc' })).toBe(
    '/project/[ref]/storage/buckets'
  )

  expect(sanitizeRoute('/project/[ref]/editor/[tableId]', { ref: 'abc', tableId: '10' })).toBe(
    '/project/[ref]/editor'
  )
  expect(
    sanitizeRoute('/project/[ref]/storage/buckets/[bucketId]', { ref: 'abc', bucketId: 'bucket-1' })
  ).toBe('/project/[ref]/storage/buckets')
  expect(sanitizeRoute('/project/[ref]/logs/explorer?q=select', { ref: 'abc' })).toBe(
    '/project/[ref]/logs/explorer?q=select'
  )
})
