import { fireEvent, screen } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { describe, expect, it, vi } from 'vitest'

import { SecurityDefinerViewPopover } from './SecurityDefinerViewPopover'
import type { Lint } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'

const lint: Lint = {
  name: 'security_definer_view',
  title: 'Security Definer View',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'View uses its creator permissions',
  detail: 'View public.accounts uses SECURITY DEFINER',
  remediation:
    'https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view',
  metadata: { type: 'view', schema: 'public', name: 'accounts' },
  cache_key: 'security_definer_view_public_accounts',
}

describe('Security Definer view guidance', () => {
  it.each([false, true])(
    'links to the selected finding in the active variant: %s',
    (issuesInbox) => {
      const onAutofix = vi.fn()
      customRender(
        <FeatureFlagContext.Provider value={{ configcat: { issuesInbox }, posthog: {} }}>
          <SecurityDefinerViewPopover lint={lint} onAutofix={onAutofix} />
        </FeatureFlagContext.Provider>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Security Definer view' }))

      expect(screen.getByText('Secure your view')).toBeInTheDocument()
      if (issuesInbox) {
        expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
          'href',
          '/project/default/issues/security_definer_view'
        )
      } else {
        expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
          'href',
          '/project/default/advisors/security?preset=ERROR&id=security_definer_view_public_accounts'
        )
      }
      fireEvent.click(screen.getByRole('button', { name: 'Autofix' }))
      expect(onAutofix).toHaveBeenCalledOnce()
    }
  )
})
