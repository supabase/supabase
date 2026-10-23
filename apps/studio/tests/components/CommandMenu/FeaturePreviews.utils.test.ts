import { describe, expect, it, vi } from 'vitest'

import { resolveFeaturePreviewToggle } from '@/components/interfaces/App/CommandMenu/FeaturePreviews.utils'

describe('resolveFeaturePreviewToggle', () => {
  it('returns disabled when the preview is being turned off', () => {
    const preview = { getRoute: vi.fn(() => '/project/abc/explorer') }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: false,
      pathname: '/project/[ref]/explorer',
      ref: 'abc',
    })

    expect(outcome).toStrictEqual({ type: 'disabled' })
    expect(preview.getRoute).not.toHaveBeenCalled()
  })

  it('returns disabled regardless of pathname/ref when turning off', () => {
    const preview = { getRoute: () => '/project/abc/explorer' }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: false,
      pathname: '/org/some-org',
      ref: undefined,
    })

    expect(outcome).toStrictEqual({ type: 'disabled' })
  })

  it('returns a route when enabling on a project-scoped page with a ref', () => {
    const preview = { getRoute: (ref?: string) => `/project/${ref}/explorer` }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: true,
      pathname: '/project/[ref]/explorer',
      ref: 'abc',
    })

    expect(outcome).toStrictEqual({ type: 'enabled', route: '/project/abc/explorer' })
  })

  it('does not route when enabling on a non-project-scoped page (e.g. org view)', () => {
    const preview = { getRoute: (ref?: string) => `/project/${ref}/explorer` }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: true,
      pathname: '/org/some-org',
      ref: 'abc',
    })

    expect(outcome).toStrictEqual({ type: 'enabled' })
  })

  it('does not route when enabling with no ref, even on a project-scoped pathname', () => {
    const preview = { getRoute: (ref?: string) => `/project/${ref}/explorer` }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: true,
      pathname: '/project/[ref]/explorer',
      ref: undefined,
    })

    expect(outcome).toStrictEqual({ type: 'enabled' })
  })

  it('does not route when the preview has no getRoute', () => {
    const preview = {}

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: true,
      pathname: '/project/[ref]/explorer',
      ref: 'abc',
    })

    expect(outcome).toStrictEqual({ type: 'enabled' })
  })

  it('does not route when getRoute returns undefined', () => {
    const preview = { getRoute: () => undefined as unknown as string }

    const outcome = resolveFeaturePreviewToggle({
      preview,
      isEnabling: true,
      pathname: '/project/[ref]/explorer',
      ref: 'abc',
    })

    expect(outcome).toStrictEqual({ type: 'enabled' })
  })
})
