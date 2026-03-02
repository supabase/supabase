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
      { slug: 'my-org' } as any
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
})
