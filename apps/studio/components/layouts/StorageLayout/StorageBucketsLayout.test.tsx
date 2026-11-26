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

    const policiesLink = screen.getByRole('link', { name: 'Policies' })
    const bucketsLink = screen.getByRole('link', { name: 'Buckets' })

    expect(policiesLink).toHaveAttribute('aria-current', 'page')
    expect(policiesLink.closest('li')).toHaveAttribute('aria-selected', 'true')
    expect(bucketsLink).not.toHaveAttribute('aria-current')
    expect(bucketsLink.closest('li')).toHaveAttribute('aria-selected', 'false')
  })

  it('keeps the buckets tab marked as current when query params are present', () => {
    routerMock.setCurrentUrl('/project/default/storage/files?new=true')

    customRender(
      <StorageBucketsLayout>
        <div>Buckets content</div>
      </StorageBucketsLayout>,
      { initialUrl: '/project/default/storage/files?new=true' }
    )

    const bucketsLink = screen.getByRole('link', { name: 'Buckets' })
    const policiesLink = screen.getByRole('link', { name: 'Policies' })

    expect(bucketsLink).toHaveAttribute('aria-current', 'page')
    expect(bucketsLink.closest('li')).toHaveAttribute('aria-selected', 'true')
    expect(policiesLink).not.toHaveAttribute('aria-current')
    expect(policiesLink.closest('li')).toHaveAttribute('aria-selected', 'false')
  })
})
