import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ValidationWarningsAdmonition } from './UpgradeWarnings'
import { ProjectUpgradeEligibilityWarning } from '@/data/config/project-upgrade-eligibility-query'
import { customRender } from '@/tests/lib/custom-render'

describe('ValidationWarningsAdmonition', () => {
  it('renders the specific copy and link for a known warning type', () => {
    customRender(<ValidationWarningsAdmonition warnings={[{ type: 'ltree_reindex_required' }]} />)

    expect(
      screen.getByText('ltree indexes must be reindexed after this upgrade')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Read upgrade notes' })).toHaveAttribute(
      'href',
      expect.stringContaining('#ltree-indexes-require-reindexing-after-upgrade')
    )
  })

  // The API can ship new warning types before Studio knows about them, and old
  // browser tabs keep running old bundles, so an unknown type must not crash the page.
  it('renders fallback copy and a link for a warning type Studio does not know about', () => {
    const unknownWarning = {
      type: 'some_future_warning',
    } as unknown as ProjectUpgradeEligibilityWarning

    customRender(<ValidationWarningsAdmonition warnings={[unknownWarning]} />)

    expect(screen.getByText('Review the upgrade notes before upgrading')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Read upgrade notes' })).toHaveAttribute(
      'href',
      expect.stringContaining('/guides/platform/upgrading#specific-upgrade-notes')
    )
  })
})
