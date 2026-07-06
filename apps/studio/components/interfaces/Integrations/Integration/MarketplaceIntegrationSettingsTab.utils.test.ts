import { describe, expect, test } from 'vitest'

import { getGroupContent, KIND_ORDER } from './MarketplaceIntegrationSettingsTab.utils'
import { type ConnectedResourceUsage } from '@/components/interfaces/Integrations/Landing/Landing.utils'

const base = { integrationName: 'Grafana', orgSlug: 'acme', projectRef: 'abcdefghijklmnop' }

describe('getGroupContent', () => {
  test('falls back to generic copy when no usage override is provided', () => {
    const group = getGroupContent({ kind: 'api_key', count: 1, ...base })
    expect(group.note).toContain('Removing this key')
    expect(group.missingNote).toContain('No secret API key is connected for Grafana')
  })

  test('uses integration-specific usage copy when provided', () => {
    const usage: ConnectedResourceUsage = {
      removalWarning: 'Removing this key stops metrics collection.',
      noteWhenAbsent: 'No API key connected. Dashboards will not receive data.',
    }
    const group = getGroupContent({ kind: 'api_key', count: 1, ...base, usage })
    expect(group.note).toBe(usage.removalWarning)
    expect(group.missingNote).toBe(usage.noteWhenAbsent)
  })

  test('pluralizes the title and notes based on count', () => {
    const single = getGroupContent({ kind: 'api_key', count: 1, ...base })
    const plural = getGroupContent({ kind: 'api_key', count: 3, ...base })
    expect(single.title).toBe('Secret API key')
    expect(plural.title).toBe('Secret API keys')
    expect(plural.note).toContain('a key')
  })

  test('exposes the OAuth app manage action only when an org slug is present', () => {
    expect(getGroupContent({ kind: 'oauth_app', count: 1, ...base }).manageAction).toEqual({
      label: 'Manage access',
      href: '/org/acme/apps',
    })
    expect(
      getGroupContent({ kind: 'oauth_app', count: 1, integrationName: 'Grafana' }).manageAction
    ).toBeUndefined()
  })

  test('points the SMTP manage action at the project auth settings', () => {
    const group = getGroupContent({ kind: 'smtp', count: 1, ...base })
    expect(group.manageAction).toEqual({
      label: 'Manage settings',
      href: '/project/abcdefghijklmnop/auth/smtp',
    })
  })

  test('always returns a missing note for every resource kind', () => {
    for (const kind of KIND_ORDER) {
      const group = getGroupContent({ kind, count: 1, ...base })
      expect(group.missingNote.length).toBeGreaterThan(0)
    }
  })
})
