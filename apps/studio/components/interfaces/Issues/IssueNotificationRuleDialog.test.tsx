import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IssueNotificationRuleDialog } from './IssueNotificationRuleDialog'
import { listIssueNotificationRules, resetIssuesMock } from '@/data/issues/mock/issues-mock-api'
import { customRender } from '@/tests/lib/custom-render'

const projectRef = 'notification-dialog'

describe('IssueNotificationRuleDialog', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetIssuesMock(projectRef)
  })

  it('saves a rule limited to the checks picked from the multi-select', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    customRender(<IssueNotificationRuleDialog projectRef={projectRef} onClose={onClose} />)

    await user.type(screen.getByRole('textbox', { name: 'Channel' }), '#security')
    const checksTrigger = screen.getByRole('combobox', { name: 'Checks' })
    expect(checksTrigger).toHaveTextContent('All issues')

    await user.click(checksTrigger)
    const options = await screen.findByRole('listbox')
    const rlsCheck = await within(options).findByText('RLS Disabled in Public')
    expect(within(options).getByText('Security')).toBeInTheDocument()
    expect(within(options).getByText('Performance')).toBeInTheDocument()
    await user.click(rlsCheck)
    await user.click(within(options).getByText('Unindexed foreign keys'))
    await user.keyboard('{Escape}')

    expect(checksTrigger).toHaveTextContent('RLS Disabled in Public')
    expect(checksTrigger).toHaveTextContent('Unindexed foreign keys')

    // jsdom ignores the footer button's `form` attribute, so submit the form itself
    expect(screen.getByRole('button', { name: 'Add rule' })).toBeEnabled()
    fireEvent.submit(document.getElementById('issue-notification-rule')!)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(await listIssueNotificationRules({ projectRef })).toEqual([
      expect.objectContaining({
        destination: '#security',
        check_ids: ['rls_disabled_in_public', 'unindexed_foreign_keys'],
      }),
    ])
  })
})
