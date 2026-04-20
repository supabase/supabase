import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getEnabledFeaturesOverrideDisabledList } from './overrides'

describe('getEnabledFeaturesOverrideDisabledList', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns empty list when no env vars are set', () => {
    expect(getEnabledFeaturesOverrideDisabledList({})).toEqual([])
  })

  it('disables a feature when its env var is "false"', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_LOGS_TEMPLATES: 'false' })
    ).toEqual(['logs:templates'])
  })

  it('does not disable features whose env var is "true"', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_LOGS_TEMPLATES: 'true' })
    ).toEqual([])
  })

  it('accepts booleans case-insensitively and trims whitespace', () => {
    const result = getEnabledFeaturesOverrideDisabledList({
      ENABLED_FEATURES_LOGS_TEMPLATES: 'FALSE',
      ENABLED_FEATURES_LOGS_METADATA: ' False ',
    })
    expect(result.sort()).toEqual(['logs:metadata', 'logs:templates'])
  })

  it('maps snake_case and kebab-case keys to the env name convention', () => {
    const result = getEnabledFeaturesOverrideDisabledList({
      ENABLED_FEATURES_BRANDING_LARGE_LOGO: 'false',
      ENABLED_FEATURES_DOCS_SELF_HOSTING: 'false',
    })
    expect(result.sort()).toEqual(['branding:large_logo', 'docs:self-hosting'])
  })

  it('warns and ignores non-boolean values', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_LOGS_TEMPLATES: 'maybe' })
    ).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('must be "true" or "false"'))
  })

  it('warns and ignores env vars prefixed but not matching a known feature', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_NOT_A_FEATURE: 'false' })
    ).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not match any known feature')
    )
  })

  it('does not warn for reserved ENABLED_FEATURES_OVERRIDE_DISABLE_ALL', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_OVERRIDE_DISABLE_ALL: 'true' })
    ).toEqual([])
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('ignores env vars outside the prefix without warning', () => {
    expect(
      getEnabledFeaturesOverrideDisabledList({ NODE_ENV: 'production', PATH: '/usr/bin' })
    ).toEqual([])
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('treats an empty string value as unset', () => {
    expect(getEnabledFeaturesOverrideDisabledList({ ENABLED_FEATURES_LOGS_TEMPLATES: '' })).toEqual(
      []
    )
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
