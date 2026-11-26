import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCardWithDiff } from './ScopeGroupCardWithDiff'
import { customRender } from '@/tests/lib/custom-render'

describe('<ScopeGroupCardWithDiff>', () => {
  const getPermissionGroup = (name: string) => within(screen.getByRole('list', { name }))

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

    expect(getPermissionGroup('Write').getByText('Analytics').closest('li')).toHaveTextContent(
      'Added'
    )
    const readWrite = getPermissionGroup('Read and write')
    expect(readWrite.getByText('Database management').closest('li')).toHaveTextContent('Added')
    expect(readWrite.getByText('Domains').closest('li')).toHaveTextContent('Removed')
    const read = getPermissionGroup('Read only')
    expect(read.getByText('Database management').closest('li')).toHaveTextContent('Removed')
    expect(read.getByText('Domains').closest('li')).toHaveTextContent('Added')
    expect(read.getByText('Organizations').closest('li')).toHaveTextContent('Removed')
    expect(read.getByText('Projects').closest('li')).toHaveTextContent('Unchanged')
  })

  test('hides unchanged permissions if empty', async () => {
    customRender(
      <ScopeGroupCardWithDiff
        previousScopes={['database:read']}
        scopes={['database:read', 'database:write']}
      />
    )

    expect(getPermissionGroup('Read and write').getByText('Added')).toBeInTheDocument()
    expect(getPermissionGroup('Read only').getByText('Removed')).toBeInTheDocument()
    expect(screen.queryByText('Unchanged')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Already granted/ })).not.toBeInTheDocument()
  })
})
