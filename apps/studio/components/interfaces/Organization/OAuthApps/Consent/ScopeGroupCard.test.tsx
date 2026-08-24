import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { ScopeGroupCard } from './ScopeGroupCard'
import type { OAuthScopeGroup } from '@/data/oauth-apps/types'
import { customRender } from '@/tests/lib/custom-render'

const SCOPE_GROUPS: OAuthScopeGroup[] = [
  {
    name: 'Project Settings, Action Runs, Logs, SQL Snippets',
    level: 'read_write',
    scopes: ['project_settings', 'action_runs', 'logs', 'sql_snippets'],
  },
  {
    name: 'Database Webhooks, Development Branches, Production Branches',
    level: 'read',
    scopes: ['database_webhooks', 'development_branches', 'production_branches'],
  },
]

describe('ScopeGroupCard', () => {
  test('interpolates the app name into the intro line', () => {
    customRender(
      <ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} memberRole="Developer" />
    )

    expect(
      screen.getByText(
        'Authorizing Vercel grants it the following access permissions to the selected projects.'
      )
    ).toBeInTheDocument()
  })

  test('renders READ and READ + WRITE badge labels', () => {
    customRender(
      <ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} memberRole="Developer" />
    )

    expect(screen.getByText('READ + WRITE')).toBeInTheDocument()
    expect(screen.getByText('READ')).toBeInTheDocument()
  })

  test('shows the over-role annotation only for groups that exceed a Read-only role', () => {
    customRender(
      <ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} memberRole="Read-only" />
    )

    expect(screen.getAllByText('Read-only for your role')).toHaveLength(1)
  })

  test('shows no over-role annotation for a role that can write', () => {
    customRender(
      <ScopeGroupCard appName="Vercel" scopeGroups={SCOPE_GROUPS} memberRole="Developer" />
    )

    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })
})
