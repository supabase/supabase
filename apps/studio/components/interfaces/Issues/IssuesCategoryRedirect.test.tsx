import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { IssuesCategoryRedirect } from './IssuesCategoryRedirect'
import { customRender } from '@/tests/lib/custom-render'

describe('IssuesCategoryRedirect', () => {
  it('preserves legacy finding and severity parameters and hash', async () => {
    window.history.replaceState(
      {},
      '',
      '/project/default/advisors/security?id=opaque-key&preset=WARN#finding'
    )
    const onRedirect = vi.fn()
    customRender(<IssuesCategoryRedirect category="security" onRedirect={onRedirect} />)
    await waitFor(() =>
      expect(onRedirect).toHaveBeenCalledWith(
        '/project/default/issues?id=opaque-key&preset=WARN&category=security#finding'
      )
    )
  })
})
