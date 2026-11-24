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
  test('renders Read only and Read and write headings', () => {
    customRender(<ScopeGroupCard scopes={SCOPE_GROUPS} />)

    expect(screen.getByText('Read and write')).toBeInTheDocument()
    expect(screen.getByText('Read only')).toBeInTheDocument()
  })

  test('renders a Write heading for a write-only group', () => {
    customRender(<ScopeGroupCard scopes={['analytics:write']} />)

    expect(screen.getByText('Write')).toBeInTheDocument()
  })

  test('renders no over-role annotation', () => {
    customRender(<ScopeGroupCard scopes={SCOPE_GROUPS} />)

    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
    expect(screen.queryByText('READ + WRITE')).not.toBeInTheDocument()
  })
})
