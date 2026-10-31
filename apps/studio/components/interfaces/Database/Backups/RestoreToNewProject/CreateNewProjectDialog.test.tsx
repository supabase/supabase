import { describe, expect, it, vi } from 'vitest'

import { CreateNewProjectDialog } from './CreateNewProjectDialog'
import { customRender } from '@/tests/lib/custom-render'

describe('CreateNewProjectDialog', () => {
  it('opts the new database password field out of password-manager autofill', () => {
    customRender(
      <CreateNewProjectDialog
        open
        selectedBackupId={1}
        recoveryTimeTarget={null}
        onOpenChange={vi.fn()}
        onCloneSuccess={vi.fn()}
        additionalMonthlySpend={{ diskPrice: 0, computePrice: 0 }}
      />
    )

    const input = document.querySelector('#db-password')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('autocomplete')).toBe('new-password')
    expect(input?.hasAttribute('data-1p-ignore')).toBe(true)
    expect(input?.getAttribute('data-lpignore')).toBe('true')
    expect(input?.getAttribute('data-form-type')).toBe('other')
    expect(input?.hasAttribute('data-bwignore')).toBe(true)
  })
})
