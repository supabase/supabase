import React, { type ComponentType } from 'react'

/**
 * Lazy-loaded product menu components to avoid circular dependencies
 * (registry -> Layout -> ProjectLayout -> MobileMenuContent -> registry).
 * Sections without a dedicated product menu map to null.
 */
export const MOBILE_PRODUCT_MENU_REGISTRY: Record<string, ComponentType | null> = {
  HOME: null,
  editor: React.lazy(() =>
    import('components/layouts/TableEditorLayout/TableEditorMenu').then((m) => ({
      default: m.TableEditorMenu,
    }))
  ),
  sql: React.lazy(() =>
    import('components/layouts/SQLEditorLayout/SQLEditorMenu').then((m) => ({
      default: m.SQLEditorMenu,
    }))
  ),
  database: React.lazy(() =>
    import('components/layouts/DatabaseLayout/DatabaseLayout').then((m) => ({
      default: m.DatabaseProductMenu,
    }))
  ),
  auth: React.lazy(() =>
    import('components/layouts/AuthLayout/AuthLayout').then((m) => ({
      default: m.AuthProductMenu,
    }))
  ),
  storage: React.lazy(() =>
    import('components/interfaces/Storage/StorageMenuV2').then((m) => ({
      default: m.StorageMenuV2,
    }))
  ),
  functions: React.lazy(() =>
    import('components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout').then((m) => ({
      default: m.EdgeFunctionsProductMenu,
    }))
  ),
  realtime: React.lazy(() =>
    import('components/layouts/RealtimeLayout/RealtimeLayout').then((m) => ({
      default: m.RealtimeProductMenu,
    }))
  ),
  advisors: React.lazy(() =>
    import('components/layouts/AdvisorsLayout/AdvisorsSidebarMenu').then((m) => ({
      default: m.AdvisorsSidebarMenu,
    }))
  ),
  observability: React.lazy(() =>
    import('components/layouts/ObservabilityLayout/ObservabilityMenu').then((m) => ({
      default: m.default,
    }))
  ),
  logs: React.lazy(() =>
    import('components/layouts/LogsLayout/LogsSidebarMenuV2').then((m) => ({
      default: m.LogsSidebarMenuV2,
    }))
  ),
  api: null,
  integrations: null,
  settings: React.lazy(() =>
    import('components/layouts/ProjectSettingsLayout/SettingsLayout').then((m) => ({
      default: m.SettingsProductMenu,
    }))
  ),
}

export function getProductMenuComponent(sectionKey: string): ComponentType | null {
  return MOBILE_PRODUCT_MENU_REGISTRY[sectionKey] ?? null
}
