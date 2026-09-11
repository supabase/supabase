import { describe, expect, it } from 'vitest'

import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import {
  applyResourceList,
  formatResourceList,
  getResourceWarningAiPrompt,
  getResourceWarningCorrectionUrl,
  getResourceWarningLabels,
  getResourceWarningMetricsHref,
  getTroubleshootItems,
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

describe('formatResourceList', () => {
  it('returns a single label as is', () => {
    expect(formatResourceList(['CPU'])).toBe('CPU')
  })

  it('joins two labels with and', () => {
    expect(formatResourceList(['CPU', 'Disk IO'])).toBe('CPU and Disk IO')
  })

  it('joins three labels with an Oxford comma', () => {
    expect(formatResourceList(['CPU', 'Disk IO', 'Memory'])).toBe('CPU, Disk IO, and Memory')
  })
})

describe('getResourceWarningLabels', () => {
  it('drops response keys that have no config entry', () => {
    expect(getResourceWarningLabels(['cpu_exhaustion', 'need_pitr'])).toEqual(['CPU'])
  })
})

describe('getResourceWarningMetricsHref', () => {
  it('links a warning to its chart over the last 3 hours', () => {
    expect(getResourceWarningMetricsHref('cpu_exhaustion', 'abc')).toBe(
      '/project/abc/observability/database?chart=cpu-usage&isHelper=true&helperText=Last+3+hours'
    )
  })

  it('defaults disk IO to the always-rendered throughput chart', () => {
    expect(getResourceWarningMetricsHref('disk_io_exhaustion', 'abc')).toContain(
      'chart=disk-throughput'
    )
  })

  it('targets the burst balance chart for disk IO when that chart is shown', () => {
    expect(getResourceWarningMetricsHref('disk_io_exhaustion', 'abc', true)).toContain(
      'chart=disk-io-burst-balance'
    )
  })

  it('leaves other warnings alone when the burst balance chart is shown', () => {
    expect(getResourceWarningMetricsHref('cpu_exhaustion', 'abc', true)).toContain(
      'chart=cpu-usage'
    )
  })

  it.each(['auth_rate_limit_exhaustion', 'is_readonly_mode_enabled'])(
    'returns undefined for %s, which has no chart',
    (warningType) => {
      expect(getResourceWarningMetricsHref(warningType, 'abc')).toBeUndefined()
    }
  )
})

describe('applyResourceList', () => {
  it('fills the multi-resource title with the tripped resources', () => {
    expect(
      applyResourceList(
        RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.bannerContent.warning.title,
        ['cpu_exhaustion', 'disk_space_exhaustion']
      )
    ).toBe('Your project is exhausting CPU and Disk space, which is affecting its performance')
  })
})

describe('getTroubleshootItems', () => {
  const kindsOf = (items: ReturnType<typeof getTroubleshootItems>) => items.map((item) => item.kind)

  it('lists metrics, then docs, then AI for a multi-resource banner', () => {
    const items = getTroubleshootItems({
      activeWarnings: ['cpu_exhaustion', 'disk_space_exhaustion'],
      projectRef: 'abc',
      aiPrompt: 'prompt',
    })
    expect(kindsOf(items)).toEqual(['metrics', 'metrics', 'docs', 'docs', 'ai'])
    expect(items[0].menuLabel).toBe('View CPU metrics')
    expect(items[2].menuLabel).toBe('CPU documentation')
    expect(items[3].menuLabel).toBe('Disk space documentation')
  })

  it('keeps the generic labels for a single-resource banner', () => {
    const items = getTroubleshootItems({
      activeWarnings: ['cpu_exhaustion'],
      projectRef: 'abc',
      aiPrompt: 'prompt',
    })
    expect(kindsOf(items)).toEqual(['metrics', 'docs', 'ai'])
    expect(items[0].menuLabel).toBe('View metrics')
  })

  it('skips the metrics item for warnings without a chart', () => {
    const items = getTroubleshootItems({
      activeWarnings: ['auth_rate_limit_exhaustion'],
      projectRef: 'abc',
      aiPrompt: 'prompt',
    })
    expect(kindsOf(items)).toEqual(['docs', 'ai'])
  })

  it('leaves read-only mode with a single Learn more button', () => {
    const items = getTroubleshootItems({
      activeWarnings: ['is_readonly_mode_enabled'],
      projectRef: 'abc',
      aiPrompt: undefined,
    })
    expect(kindsOf(items)).toEqual(['docs'])
    expect(items[0].buttonLabel).toBe('Learn more')
  })

  it('gives disk space a metrics and a docs item without an AI prompt', () => {
    const items = getTroubleshootItems({
      activeWarnings: ['disk_space_exhaustion'],
      projectRef: 'abc',
      aiPrompt: undefined,
    })
    expect(kindsOf(items)).toEqual(['metrics', 'docs'])
  })
})

describe('getResourceWarningAiPrompt', () => {
  it('uses the entry prompt for a single warning', () => {
    expect(getResourceWarningAiPrompt(['cpu_exhaustion'])).toBe(
      RESOURCE_WARNING_MESSAGES.cpu_exhaustion.aiPrompt
    )
  })

  it('names the tripped resources for multiple warnings', () => {
    expect(getResourceWarningAiPrompt(['cpu_exhaustion', 'disk_space_exhaustion'])).toContain(
      '(CPU and Disk space)'
    )
  })
})
