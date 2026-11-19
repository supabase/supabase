import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCard } from './ScopeGroupCard'
import type { OAuthScope } from '@/data/oauth-apps/types'
import { customRender } from '@/tests/lib/custom-render'

const SCOPE_GROUPS: OAuthScope[] = [
  'database:read',
  'database:write',
  'environment:read',
  'environment:write',
  'projects:read',
  'edge_functions:read',
  'storage:read',
]

describe('ScopeGroupCard', () => {
  test('renders READ ONLY and READ AND WRITE badge labels', () => {
    customRender(<ScopeGroupCard scopes={SCOPE_GROUPS} />)

    expect(screen.getByText('READ AND WRITE')).toBeInTheDocument()
    expect(screen.getByText('READ ONLY')).toBeInTheDocument()
  })

  test('renders a WRITE badge for a write-only group', () => {
    customRender(<ScopeGroupCard scopes={['analytics:write']} />)

    expect(screen.getByText('WRITE')).toBeInTheDocument()
  })

  test('groups read-write table data with the requested database management permission', () => {
    customRender(<ScopeGroupCard scopes={SCOPE_GROUPS} databaseAccess="write" />)

    const databaseManagement = screen.getByRole('button', { name: 'Database management' })
    const tableData = screen.getByRole('button', { name: 'Table data' })
    expect(databaseManagement.parentElement).toContainElement(tableData)
  })

  test('renders no over-role annotation', () => {
    customRender(<ScopeGroupCard scopes={SCOPE_GROUPS} />)

    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })
})
