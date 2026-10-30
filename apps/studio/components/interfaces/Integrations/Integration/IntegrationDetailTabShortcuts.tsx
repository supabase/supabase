import { useRouter } from 'next/router'

import type { IntegrationTab } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { SHORTCUT_REFERENCE_GROUPS } from '@/state/shortcuts/referenceGroups'
import { DynamicShortcut } from '@/state/shortcuts/useDynamicShortcut'

const TAB_DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * Binds digit keys 1-9 to whichever tabs the active integration declares in
 * its `navigation` array. Render this once per integration detail page —
 * shared between `LegacyIntegrationPage` and the marketplace `MarketplaceDetail`
 * since both surfaces drive off the same `tabs` shape from `useIntegrationDetail`.
 *
 * The dynamic shortcut registry handles per-tab label overrides ("Go to Jobs",
 * "Go to Wrappers", etc.) so the reference sheet and Cmd+K pick up the actual
 * tab name without us having to pre-declare every possible integration tab.
 */
export interface IntegrationDetailTabShortcutsProps {
  tabs: IntegrationTab[]
  enabled?: boolean
}

export const IntegrationDetailTabShortcuts = ({
  tabs,
  enabled = true,
}: IntegrationDetailTabShortcutsProps) => {
  const router = useRouter()

  return (
    <>
      {tabs.slice(0, TAB_DIGIT_KEYS.length).map((tab, index) => (
        <DynamicShortcut
          key={tab.href}
          id={`integration-detail.tab-${index}`}
          sequence={[TAB_DIGIT_KEYS[index]]}
          label={`Go to ${tab.label}`}
          referenceGroup={SHORTCUT_REFERENCE_GROUPS.NAVIGATION_INTEGRATIONS_DETAIL}
          enabled={enabled && !tab.active}
          registerInCommandMenu
          callback={() => router.push(tab.href)}
        />
      ))}
    </>
  )
}
