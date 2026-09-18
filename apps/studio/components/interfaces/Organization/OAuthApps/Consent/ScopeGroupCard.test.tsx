import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCard } from './ScopeGroupCard'
import type { OAuthScopeGroup } from '@/data/oauth-apps/types'
import { customRender } from '@/tests/lib/custom-render'

const SCOPE_GROUPS: OAuthScopeGroup[] = [
  {
    name: 'Database, Environment, Secrets',
    level: 'read_write',
    scopes: ['database:read', 'database:write', 'environment:read', 'environment:write'],
  },
  {
    name: 'Projects, Edge Functions, Storage',
    level: 'read',
    scopes: ['projects:read', 'edge_functions:read', 'storage:read'],
  },
]

describe('ScopeGroupCard', () => {
  test('interpolates the app name into the intro line', () => {
    customRender(<ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} />)

    expect(
      screen.getByText(
        'Authorizing Vercel grants it the following access permissions to the selected projects.'
      )
    ).toBeInTheDocument()
  })

  test('renders READ and READ-WRITE badge labels', () => {
    customRender(<ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} />)

    expect(screen.getByText('READ-WRITE')).toBeInTheDocument()
    expect(screen.getByText('READ')).toBeInTheDocument()
  })

  test('renders a WRITE badge for a write-only group', () => {
    customRender(
      <ScopeGroupCard
        appName="Vercel"
        scopeGroups={[{ name: 'Analytics', level: 'write', scopes: ['analytics:write'] }]}
      />
    )

    expect(screen.getByText('WRITE')).toBeInTheDocument()
  })

  test('renders no over-role annotation', () => {
    customRender(<ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} />)

    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
    expect(screen.queryByText('READ + WRITE')).not.toBeInTheDocument()
  })
})
