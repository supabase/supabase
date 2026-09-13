import { describe, expect, it } from 'vitest'

import {
  getResourceWarningCorrectionUrl,
  isComputeUpgradeWarning,
} from './ResourceExhaustionWarningBanner.utils'

describe('resource warning correction routes', () => {
  it.each(['cpu', 'ram', 'disk_io'])('sends paid-plan %s warnings to Infrastructure', (metric) => {
    expect(
      getResourceWarningCorrectionUrl({
        metric,
        activeWarnings: [`${metric}_warning`],
        projectRef: 'project-ref',
        isFreePlan: false,
        organizationSlug: 'org-slug',
      })
    ).toBe('/project/project-ref/settings/infrastructure')
  })

  it('sends free-plan compute warnings to the plan upgrade panel', () => {
    expect(
      getResourceWarningCorrectionUrl({
        metric: 'cpu',
        activeWarnings: ['cpu_exhaustion'],
        projectRef: 'project-ref',
        isFreePlan: true,
        organizationSlug: 'org-slug',
      })
    ).toBe('/org/org-slug/billing?panel=subscriptionPlan&source=resource_exhaustion_banner')
  })

  it('treats multiple compute-resource warnings as a compute upgrade', () => {
    const activeWarnings = ['cpu_exhaustion', 'memory_and_swap_exhaustion']

    expect(isComputeUpgradeWarning(null, activeWarnings)).toBe(true)
    expect(
      getResourceWarningCorrectionUrl({
        metric: null,
        activeWarnings,
        projectRef: 'project-ref',
        isFreePlan: false,
      })
    ).toBe('/project/project-ref/settings/infrastructure')
  })

  it.each(['disk_space', 'read_only'])('sends %s warnings to Infrastructure', (metric) => {
    expect(
      getResourceWarningCorrectionUrl({
        metric,
        activeWarnings: ['disk_space_exhaustion'],
        projectRef: 'project-ref',
        isFreePlan: false,
      })
    ).toBe('/project/project-ref/settings/infrastructure')
  })

  it('preserves non-infrastructure correction destinations', () => {
    expect(
      getResourceWarningCorrectionUrl({
        metric: 'auth_email_rate_limit',
        activeWarnings: ['auth_rate_limit_exhaustion'],
        projectRef: 'project-ref',
        isFreePlan: false,
      })
    ).toBe('/project/project-ref/auth/rate-limits')
  })

  it('keeps the fallback metric anchor on Infrastructure', () => {
    expect(
      getResourceWarningCorrectionUrl({
        metric: 'custom_metric',
        activeWarnings: ['custom_warning'],
        projectRef: 'project-ref',
        isFreePlan: false,
      })
    ).toBe('/project/project-ref/settings/infrastructure#custom_metric')
  })
})
