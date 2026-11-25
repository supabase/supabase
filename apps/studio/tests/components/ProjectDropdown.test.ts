import { expect, test } from 'vitest'

import { sanitizeRoute } from '@/components/layouts/AppLayout/ProjectDropdown.utils'

test('Should sanitize project routes correctly when switching projects by removing project specific parameters', () => {
  expect(sanitizeRoute('/project/$ref')).toBe('/project/$ref')
  expect(sanitizeRoute('/project/$ref/editor')).toBe('/project/$ref/editor')
  expect(sanitizeRoute('/project/$ref/storage/buckets')).toBe('/project/$ref/storage/buckets')

  expect(sanitizeRoute('/project/$ref/editor/$tableId')).toBe('/project/$ref/editor')
  expect(sanitizeRoute('/project/$ref/storage/buckets/$bucketId')).toBe(
    '/project/$ref/storage/buckets'
  )
  expect(sanitizeRoute('/project/$ref/logs/explorer?q=select')).toBe(
    '/project/$ref/logs/explorer?q=select'
  )
  expect(sanitizeRoute('/project/$ref/advisors/security/$preset')).toBe(
    '/project/$ref/advisors/security'
  )
})
