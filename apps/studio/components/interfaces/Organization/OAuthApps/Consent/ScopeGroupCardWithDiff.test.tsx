import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCardWithDiff } from './ScopeGroupCardWithDiff'
import { customRender } from '@/tests/lib/custom-render'

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
    customRender(
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

    await findPermissionDiffInSection('Write', 'Analytics (New)')
    await findPermissionDiffInSection(
      'Read and write',
      'Database management (Upgraded from Read only)'
    )
    await findPermissionDiffInSection('Read only', 'Domains (Demoted from Read and write)')
    await findPermissionDiffInSection('Removed', 'Organizations (Read only)')
    fireEvent.click(await screen.findByRole('button', { name: 'Already granted (1)' }))
    await findAlreadyGrantedPermissionInSection('Read only', 'Projects')
  })

  test('hides unchanged permissions if empty', async () => {
    customRender(
      <ScopeGroupCardWithDiff
        previousScopes={['database:read']}
        scopes={['database:read', 'database:write']}
      />
    )

    await findPermissionDiffInSection(
      'Read and write',
      'Database management (Upgraded from Read only)'
    )
    expect(screen.queryByRole('button', { name: /Already granted/ })).toBeNull()
  })
})
