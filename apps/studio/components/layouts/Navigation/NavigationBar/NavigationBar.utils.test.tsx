import { describe, expect, it } from 'vitest'

import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import type { Project } from '@/data/projects/project-detail-query'

const REF = 'test-project-ref'

const activeProject = { status: 'ACTIVE_HEALTHY' } as Project
const buildingProject = { status: 'COMING_UP' } as Project
const inactiveProject = { status: 'INACTIVE' } as Project

const keys = (routes: { key: string }[]) => routes.map((r) => r.key)

describe('generateToolRoutes', () => {
  it('always returns Table Editor and SQL Editor', () => {
    const routes = generateToolRoutes(REF, activeProject)
    expect(keys(routes)).toEqual(['editor', 'sql'])
  })

  it('marks routes as disabled when project is not active', () => {
    const routes = generateToolRoutes(REF, inactiveProject)
    expect(routes.every((r) => r.disabled)).toBe(true)
  })

  it('points links to the building URL when project is building', () => {
    const routes = generateToolRoutes(REF, buildingProject)
    expect(routes.every((r) => r.link === `/project/${REF}`)).toBe(true)
  })

  it('returns links as false when ref is undefined', () => {
    const routes = generateToolRoutes(undefined, activeProject)
    expect(routes.every((r) => r.link === undefined)).toBe(true)
  })
})

describe('generateProductRoutes', () => {
  it('includes all product routes when all features are enabled', () => {
    const routes = generateProductRoutes(REF, activeProject, {
      auth: true,
      storage: true,
      edgeFunctions: true,
      realtime: true,
    })
    expect(keys(routes)).toEqual(['database', 'auth', 'storage', 'functions', 'realtime'])
  })

  it('includes all product routes by default (features default to true)', () => {
    const routes = generateProductRoutes(REF, activeProject)
    expect(keys(routes)).toEqual(['database', 'auth', 'storage', 'functions', 'realtime'])
  })

  it('excludes auth when auth feature is disabled', () => {
    const routes = generateProductRoutes(REF, activeProject, { auth: false })
    expect(keys(routes)).not.toContain('auth')

    expect(keys(routes)).toContain('database')
    expect(keys(routes)).toContain('storage')
  })

  it('excludes storage when storage feature is disabled', () => {
    const routes = generateProductRoutes(REF, activeProject, { storage: false })
    expect(keys(routes)).not.toContain('storage')
  })

  it('excludes edge functions when edgeFunctions feature is disabled', () => {
    const routes = generateProductRoutes(REF, activeProject, { edgeFunctions: false })
    expect(keys(routes)).not.toContain('functions')
  })

  it('excludes realtime when realtime feature is disabled', () => {
    const routes = generateProductRoutes(REF, activeProject, { realtime: false })
    expect(keys(routes)).not.toContain('realtime')
  })

  it('links auth to overview page when authOverviewPage is enabled', () => {
    const routes = generateProductRoutes(REF, activeProject, { authOverviewPage: true })
    const authRoute = routes.find((r) => r.key === 'auth')
    expect(authRoute?.link).toBe(`/project/${REF}/auth/overview`)
  })

  it('links auth to users page by default', () => {
    const routes = generateProductRoutes(REF, activeProject)
    const authRoute = routes.find((r) => r.key === 'auth')
    expect(authRoute?.link).toBe(`/project/${REF}/auth/users`)
  })

  it('always includes database even when all optional features are disabled', () => {
    const routes = generateProductRoutes(REF, activeProject, {
      auth: false,
      storage: false,
      edgeFunctions: false,
      realtime: false,
    })
    expect(keys(routes)).toEqual(['database'])
  })
})

describe('generateOtherRoutes', () => {
  it('always includes advisors, logs, and integrations', () => {
    const routes = generateOtherRoutes(REF, activeProject, { isPlatform: true })
    expect(keys(routes)).toContain('advisors')
    expect(keys(routes)).toContain('logs')
    expect(keys(routes)).toContain('integrations')
  })

  it('includes observability on platform when reports are enabled', () => {
    const routes = generateOtherRoutes(REF, activeProject, {
      isPlatform: true,
      showReports: true,
    })
    expect(keys(routes)).toContain('observability')
  })

  it('excludes observability on platform when reports are disabled', () => {
    const routes = generateOtherRoutes(REF, activeProject, {
      isPlatform: true,
      showReports: false,
    })
    expect(keys(routes)).not.toContain('observability')
  })

  it('excludes observability in self-hosted mode even when reports are enabled', () => {
    const routes = generateOtherRoutes(REF, activeProject, {
      isPlatform: false,
      showReports: true,
    })
    expect(keys(routes)).not.toContain('observability')
  })

  it('excludes observability in self-hosted mode when reports are disabled', () => {
    const routes = generateOtherRoutes(REF, activeProject, {
      isPlatform: false,
      showReports: false,
    })
    expect(keys(routes)).not.toContain('observability')
  })

  it('does not include API Docs nav item', () => {
    const routes = generateOtherRoutes(REF, activeProject, { isPlatform: true })
    expect(keys(routes)).not.toContain('api')
  })

  it('links logs to unified logs page when unifiedLogs is enabled', () => {
    const routes = generateOtherRoutes(REF, activeProject, {
      isPlatform: true,
      unifiedLogs: true,
    })
    const logsRoute = routes.find((r) => r.key === 'logs')
    expect(logsRoute?.link).toBe(`/project/${REF}/logs`)
  })

  it('links logs to explorer page by default', () => {
    const routes = generateOtherRoutes(REF, activeProject, { isPlatform: true })
    const logsRoute = routes.find((r) => r.key === 'logs')
    expect(logsRoute?.link).toBe(`/project/${REF}/logs/explorer`)
  })

  it('points links to building URL when project is building', () => {
    const routes = generateOtherRoutes(REF, buildingProject, {
      isPlatform: true,
      showReports: true,
    })
    const observabilityRoute = routes.find((r) => r.key === 'observability')
    expect(observabilityRoute?.link).toBe(`/project/${REF}`)
  })

  it('marks routes as disabled when project is not active', () => {
    const routes = generateOtherRoutes(REF, inactiveProject, { isPlatform: true })
    const advisorsRoute = routes.find((r) => r.key === 'advisors')
    expect(advisorsRoute?.disabled).toBe(true)
  })
})

describe('generateSettingsRoutes', () => {
  it('links to general settings on platform', () => {
    const routes = generateSettingsRoutes(REF, { isPlatform: true })
    const settingsRoute = routes.find((r) => r.key === 'settings')
    expect(settingsRoute?.link).toBe(`/project/${REF}/settings/general`)
  })

  it('links to log-drains settings in self-hosted mode', () => {
    const routes = generateSettingsRoutes(REF, { isPlatform: false })
    const settingsRoute = routes.find((r) => r.key === 'settings')
    expect(settingsRoute?.link).toBe(`/project/${REF}/settings/log-drains`)
  })

  it('returns a link as false when ref is undefined', () => {
    const routes = generateSettingsRoutes(undefined, { isPlatform: true })
    const settingsRoute = routes.find((r) => r.key === 'settings')
    expect(settingsRoute?.link).toBe(undefined)
  })
})
