import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { StorageBucketsLayout } from './StorageBucketsLayout'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

describe('StorageBucketsLayout', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/storage/files/policies')
  })

  it('marks only the nested tab as the current page on child files routes', () => {
    customRender(
      <StorageBucketsLayout>
        <div>Policies content</div>
      </StorageBucketsLayout>,
      { initialUrl: '/project/default/storage/files/policies' }
    )

    expect(screen.getByRole('link', { name: 'Policies' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Buckets' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the buckets tab marked as current when query params are present', () => {
    routerMock.setCurrentUrl('/project/default/storage/files?new=true')

    customRender(
      <StorageBucketsLayout>
        <div>Buckets content</div>
      </StorageBucketsLayout>,
      { initialUrl: '/project/default/storage/files?new=true' }
    )

    expect(screen.getByRole('link', { name: 'Buckets' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Policies' })).not.toHaveAttribute('aria-current')
  })
})
