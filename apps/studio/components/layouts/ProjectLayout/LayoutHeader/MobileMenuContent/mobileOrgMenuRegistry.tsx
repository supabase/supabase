import React, { type ComponentType } from 'react'

/**
 * Lazy-loaded org menu components for the mobile org sheet submenu.
 * Sections without a dedicated submenu map to null (they navigate directly).
 */
export const MOBILE_ORG_MENU_REGISTRY: Record<string, ComponentType<any> | null> = {
  projects: null,
  team: null,
  integrations: null,
  usage: null,
  billing: null,
  settings: React.lazy(() =>
    import('@/components/layouts/ProjectLayout/OrganizationSettingsMenu').then((m) => ({
      default: m.OrganizationSettingsMenu,
    }))
  ),
}

export function getOrgMenuComponent(sectionKey: string): ComponentType<any> | null {
  return MOBILE_ORG_MENU_REGISTRY[sectionKey] ?? null
}
