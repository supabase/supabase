import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCardWithDiff } from './ScopeGroupCardWithDiff'

describe('<ScopeGroupCardWithDiff>', () => {
  const findPermissionDiffInSection = async (section: string, permissionDiff: string) => {
    try {
      const sectionTitle = await screen.findByText(section)
      const sectionContainer = sectionTitle.parentElement!

      await within(sectionContainer).findByText(
        (_, element) => element?.textContent === permissionDiff,
        { selector: 'span' }
      )
    } catch {
      throw new Error(`Couldn't find "${permissionDiff}" in section "${section}"`)
    }
  }
  const findAlreadyGrantedPermissionInSection = async (section: string, permissionDiff: string) => {
    try {
      const button = await screen.findByRole('button', { name: /Already granted/ })
      const alreadyGrantedSection = button.parentElement!
      const sectionTitle = await within(alreadyGrantedSection).findByText(section)
      const sectionContainer = sectionTitle.parentElement!

      await within(sectionContainer).findByText(
        (_, element) => element?.textContent === permissionDiff
      )
    } catch {
      throw new Error(`Couldn't find "${permissionDiff}" in section "${section}"`)
    }
  }

  test('shows new, upgraded, downgraded, removed, and unchanged permissions', async () => {
    render(
      <ScopeGroupCardWithDiff
        previousScopes={[
          'database:read',
          'domains:read',
          'domains:write',
          'projects:read',
          'organizations:read',
        ]}
        scopes={[
          'database:read',
          'database:write',
          'domains:read',
          'analytics:write',
          'projects:read',
        ]}
      />
    )

    await findPermissionDiffInSection('WRITE', 'Analytics (New)')
    await findPermissionDiffInSection('READ-WRITE', 'Database (Upgraded from Read)')
    await findPermissionDiffInSection('READ', 'Domains (Demoted from Read-write)')
    await findPermissionDiffInSection('REMOVED', 'Organizations (Read)')
    fireEvent.click(await screen.findByRole('button', { name: 'Already granted (1)' }))
    await findAlreadyGrantedPermissionInSection('READ', 'Projects')
  })

  test('hides unchanged permissions if empty', async () => {
    render(
      <ScopeGroupCardWithDiff
        previousScopes={['database:read']}
        scopes={['database:read', 'database:write']}
      />
    )

    await findPermissionDiffInSection('READ-WRITE', 'Database (Upgraded from Read)')
    expect(screen.queryByRole('button', { name: /Already granted/ })).toBeNull()
  })
})
