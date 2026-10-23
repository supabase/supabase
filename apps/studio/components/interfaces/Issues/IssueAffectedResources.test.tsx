import { useQuery } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssueAffectedResources } from './IssueAffectedResources'
import { issueQueryOptions } from '@/data/issues/issue-query'
import { getIssue, listIssues, resetIssuesMock } from '@/data/issues/mock/issues-mock-api'
import { customRender } from '@/tests/lib/custom-render'

// The test setup mocks `useParams` from `common` to this project
const projectRef = 'default'

// Refetches the issue the way the detail page does, so a mute shows up in the list
const AffectedForIssue = ({ id }: { id: string }) => {
  const { data: issue } = useQuery(issueQueryOptions({ projectRef, id }))
  return issue ? <IssueAffectedResources issue={issue} /> : null
}

const renderIssue = (id: string) => customRender(<AffectedForIssue id={id} />)

async function findSeededIssue(title: string) {
  const { issues } = await listIssues({ projectRef, filters: { search: title } })
  const issue = issues.find((item) => item.title === title)
  if (!issue) throw new Error(`No seeded issue called ${title}`)
  return issue
}

describe('IssueAffectedResources', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetIssuesMock(projectRef)
  })

  it('lists each affected table and mutes one without touching the rest', async () => {
    const user = userEvent.setup()
    const issue = await findSeededIssue('RLS Disabled in Public')
    renderIssue(issue.id)

    const list = await screen.findByRole('list', { name: 'Affected resources' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(3)

    const [first] = rows
    const firstLabel = first.querySelector('[title]')?.getAttribute('title')
    await user.click(within(first).getByRole('button', { name: `Options for ${firstLabel}` }))
    // Radix submenus close as jsdom's pointer leaves the trigger, so pick the reason by keyboard
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('menuitem', { name: 'Mute' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(await screen.findByRole('menuitem', { name: 'Accepted risk' })).toHaveFocus()
    await user.keyboard('{Enter}')

    // The mock API waits a few hundred ms per call, and muting refetches the issue
    expect(
      await within(list).findByText('Muted as accepted risk', undefined, { timeout: 3000 })
    ).toBeInTheDocument()
    const updated = await getIssue({ projectRef, id: issue.id })
    const muted = updated.affected.filter((item) => item.muted !== null)
    expect(muted).toHaveLength(1)
    expect(muted[0].muted).toEqual(
      expect.objectContaining({ source: 'resource', reason: 'accepted_risk', until: null })
    )
    // The muted table moves to the end of the list
    await waitFor(() =>
      expect(within(list).getAllByRole('listitem').at(-1)).toHaveTextContent(firstLabel ?? '')
    )
  })

  it('lists a single affected resource the same way', async () => {
    const issue = await findSeededIssue(
      'Edge Function `send-receipt` runs out of retries when email sending times out'
    )
    renderIssue(issue.id)
    const list = await screen.findByRole('list', { name: 'Affected resources' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('send-receipt')).toBeInTheDocument()
  })
})
