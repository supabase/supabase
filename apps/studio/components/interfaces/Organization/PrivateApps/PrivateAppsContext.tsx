import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'

import type { components } from 'api-types'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { usePlatformAppsQuery } from 'data/platform-apps/platform-apps-query'
import { usePlatformAppInstallationsQuery } from 'data/platform-apps/platform-app-installations-query'

export type PrivateApp = components['schemas']['ListPlatformAppsResponse']['apps'][number]
export type Installation = components['schemas']['InstallPlatformAppResponse'] & {
  // Project scope is not yet in the API — tracked locally for the UI
  projectScope: 'all' | string[]
}

interface PrivateAppsContextValue {
  slug: string | undefined
  apps: PrivateApp[]
  isLoading: boolean
  isLoadingInstallations: boolean
  installations: Installation[]
  addInstallation: (
    data: components['schemas']['InstallPlatformAppResponse'],
    projectScope: 'all' | string[]
  ) => void
  removeInstallation: (id: string) => void
  removeInstallationsByAppId: (appId: string) => void
  setProjectScope: (installationId: string, scope: 'all' | string[]) => void
}

const PrivateAppsContext = createContext<PrivateAppsContextValue | null>(null)

export function PrivateAppsProvider({ children }: PropsWithChildren) {
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const { data: appsData, isLoading } = usePlatformAppsQuery({ slug })
  const { data: installationsData, isLoading: isLoadingInstallations, isError: installationsError } = usePlatformAppInstallationsQuery(
    { slug },
    { retry: false }
  )

  // Local state fallback when GET installations endpoint is unavailable
  const [localInstallations, setLocalInstallations] = useState<Installation[]>([])
  // Project scope overrides set locally (not in API yet)
  const [scopeOverrides, setScopeOverrides] = useState<Record<string, 'all' | string[]>>({})

  const installations = useMemo<Installation[]>(() => {
    if (!installationsError && installationsData?.installations) {
      return installationsData.installations.map((inst) => ({
        ...(inst as components['schemas']['InstallPlatformAppResponse']),
        projectScope: scopeOverrides[inst.id] ?? 'all',
      }))
    }
    return localInstallations
  }, [installationsData, installationsError, localInstallations, scopeOverrides])

  function addInstallation(
    data: components['schemas']['InstallPlatformAppResponse'],
    projectScope: 'all' | string[]
  ) {
    setLocalInstallations((prev) => [...prev, { ...data, projectScope }])
  }

  function removeInstallation(id: string) {
    setLocalInstallations((prev) => prev.filter((i) => i.id !== id))
  }

  function removeInstallationsByAppId(appId: string) {
    setLocalInstallations((prev) => prev.filter((i) => i.app_id !== appId))
  }

  function setProjectScope(installationId: string, scope: 'all' | string[]) {
    setScopeOverrides((prev) => ({ ...prev, [installationId]: scope }))
    setLocalInstallations((prev) =>
      prev.map((i) => (i.id === installationId ? { ...i, projectScope: scope } : i))
    )
  }

  return (
    <PrivateAppsContext.Provider
      value={{
        slug,
        apps: appsData?.apps ?? [],
        isLoading: isLoading || !slug,
        isLoadingInstallations: isLoadingInstallations || !slug,
        installations,
        addInstallation,
        removeInstallation,
        removeInstallationsByAppId,
        setProjectScope,
      }}
    >
      {children}
    </PrivateAppsContext.Provider>
  )
}

export function usePrivateApps() {
  const ctx = useContext(PrivateAppsContext)
  if (!ctx) throw new Error('usePrivateApps must be used within PrivateAppsProvider')
  return ctx
}
