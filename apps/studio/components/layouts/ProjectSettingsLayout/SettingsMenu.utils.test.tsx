import { describe, expect, it, vi } from 'vitest'

vi.mock('lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
  return {
    ...actual,
    IS_PLATFORM: true,
  }
})

import { generateSettingsMenu } from './SettingsMenu.utils'

describe('generateSettingsMenu', () => {
  it('includes webhooks in project settings items', () => {
    const menu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { slug: 'my-org' } as any,
      { platformWebhooks: true }
    )

    const configurationGroup = menu.find((group) => group.title === 'Configuration')
    const hasWebhooks = configurationGroup?.items.some(
      (item) => item.name === 'Webhooks' && item.url === '/project/project-ref/settings/webhooks'
    )

    expect(hasWebhooks).toBe(true)
  })

  it('hides webhooks when platformWebhooks feature is disabled', () => {
    const menu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { slug: 'my-org' } as any,
      { platformWebhooks: false }
    )

    const configurationGroup = menu.find((group) => group.title === 'Configuration')
    const hasWebhooks = configurationGroup?.items.some((item) => item.name === 'Webhooks')

    expect(hasWebhooks).toBe(false)
  })

  it('includes members link for free and pro organizations', () => {
    const freeMenu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { slug: 'my-org', plan: { id: 'free' } } as any
    )
    const proMenu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { slug: 'my-org', plan: { id: 'pro' } } as any
    )

    const hasMembersForFree = freeMenu
      .find((group) => group.title === 'Configuration')
      ?.items.some((item) => item.name === 'Members' && item.url === '/org/my-org/team')
    const hasMembersForPro = proMenu
      .find((group) => group.title === 'Configuration')
      ?.items.some((item) => item.name === 'Members' && item.url === '/org/my-org/team')

    expect(hasMembersForFree).toBe(true)
    expect(hasMembersForPro).toBe(true)
  })

  it('hides members link for non-free and non-pro organizations', () => {
    const teamMenu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { slug: 'my-org', plan: { id: 'team' } } as any
    )

    const hasMembers = teamMenu
      .find((group) => group.title === 'Configuration')
      ?.items.some((item) => item.name === 'Members')

    expect(hasMembers).toBe(false)
  })

  it('hides members link when organization slug is missing', () => {
    const menu = generateSettingsMenu(
      'project-ref',
      { status: 'ACTIVE_HEALTHY' } as any,
      { plan: { id: 'free' } } as any
    )

    const hasMembers = menu
      .find((group) => group.title === 'Configuration')
      ?.items.some((item) => item.name === 'Members')

    expect(hasMembers).toBe(false)
  })
})
