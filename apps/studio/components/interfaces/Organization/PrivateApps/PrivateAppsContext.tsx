import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { MOCK_PUBLIC_KEY } from './PrivateApps.constants'

export interface PrivateApp {
  id: string
  name: string
  description: string
  clientId: string
  publicKey: string
  permissions: string[]
  createdAt: Date
}

export interface Installation {
  id: string
  appId: string
  appName: string
  clientId: string
  projectScope: 'all' | string[]
  status: 'active' | 'suspended'
  installedAt: Date
}

interface PrivateAppsContextValue {
  apps: PrivateApp[]
  installations: Installation[]
  createApp: (data: {
    name: string
    description: string
    permissions: string[]
  }) => PrivateApp
  updateApp: (id: string, data: Partial<Pick<PrivateApp, 'name' | 'description'>>) => void
  deleteApp: (id: string) => void
  createInstallation: (data: {
    appId: string
    projectScope: 'all' | string[]
  }) => Installation
  updateInstallationScope: (id: string, projectScope: 'all' | string[]) => void
  toggleInstallationStatus: (id: string) => void
  deleteInstallation: (id: string) => void
}

const PrivateAppsContext = createContext<PrivateAppsContextValue | null>(null)

function generateClientId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'app_'
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function PrivateAppsProvider({ children }: PropsWithChildren) {
  const [apps, setApps] = useState<PrivateApp[]>([])
  const [installations, setInstallations] = useState<Installation[]>([])

  function createApp(data: { name: string; description: string; permissions: string[] }) {
    const app: PrivateApp = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      clientId: generateClientId(),
      publicKey: MOCK_PUBLIC_KEY,
      permissions: data.permissions,
      createdAt: new Date(),
    }
    setApps((prev) => [...prev, app])
    return app
  }

  function updateApp(id: string, data: Partial<Pick<PrivateApp, 'name' | 'description'>>) {
    setApps((prev) => prev.map((app) => (app.id === id ? { ...app, ...data } : app)))
  }

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((app) => app.id !== id))
    setInstallations((prev) => prev.filter((inst) => inst.appId !== id))
  }

  function createInstallation(data: { appId: string; projectScope: 'all' | string[] }) {
    const app = apps.find((a) => a.id === data.appId)
    if (!app) throw new Error('App not found')
    const installation: Installation = {
      id: crypto.randomUUID(),
      appId: data.appId,
      appName: app.name,
      clientId: app.clientId,
      projectScope: data.projectScope,
      status: 'active',
      installedAt: new Date(),
    }
    setInstallations((prev) => [...prev, installation])
    return installation
  }

  function updateInstallationScope(id: string, projectScope: 'all' | string[]) {
    setInstallations((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, projectScope } : inst))
    )
  }

  function toggleInstallationStatus(id: string) {
    setInstallations((prev) =>
      prev.map((inst) =>
        inst.id === id
          ? { ...inst, status: inst.status === 'active' ? 'suspended' : 'active' }
          : inst
      )
    )
  }

  function deleteInstallation(id: string) {
    setInstallations((prev) => prev.filter((inst) => inst.id !== id))
  }

  return (
    <PrivateAppsContext.Provider
      value={{
        apps,
        installations,
        createApp,
        updateApp,
        deleteApp,
        createInstallation,
        updateInstallationScope,
        toggleInstallationStatus,
        deleteInstallation,
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
