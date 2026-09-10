import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Platform Webhooks pages (org and project level).
 *
 * List-page actions (focus search, create new endpoint) reuse the shared
 * `list-page` IDs directly — only webhook-specific actions live here.
 */
export const PLATFORM_WEBHOOKS_SHORTCUT_IDS = {
  PLATFORM_WEBHOOKS_EDIT_ENDPOINT: 'platform-webhooks.edit-endpoint',
  PLATFORM_WEBHOOKS_COPY_ENDPOINT_URL: 'platform-webhooks.copy-endpoint-url',
  PLATFORM_WEBHOOKS_RETRY_DELIVERY: 'platform-webhooks.retry-delivery',
  PLATFORM_WEBHOOKS_COPY_PAYLOAD: 'platform-webhooks.copy-payload',
}

export type PlatformWebhooksShortcutId =
  (typeof PLATFORM_WEBHOOKS_SHORTCUT_IDS)[keyof typeof PLATFORM_WEBHOOKS_SHORTCUT_IDS]

export const platformWebhooksRegistry: RegistryDefinations<PlatformWebhooksShortcutId> = {
  [PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_EDIT_ENDPOINT]: {
    id: PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_EDIT_ENDPOINT,
    label: 'Edit endpoint',
    sequence: ['Shift+E'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_ENDPOINT_URL]: {
    id: PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_ENDPOINT_URL,
    label: 'Copy endpoint URL',
    sequence: ['Shift+U'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_RETRY_DELIVERY]: {
    id: PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_RETRY_DELIVERY,
    label: 'Retry delivery',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD]: {
    id: PLATFORM_WEBHOOKS_SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD,
    label: 'Copy payload',
    sequence: ['Shift+C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
