import { describe, expect, it } from 'vitest'

import {
  getCustomDomainDisabledReason,
  getIPv4DisabledReason,
  getPitrAlertState,
  getPitrDisabledReason,
} from './Addons.utils'

describe('getIPv4DisabledReason', () => {
  it('returns the AWS-only message for non-AWS projects', () => {
    expect(
      getIPv4DisabledReason({
        isAws: false,
        isProjectActive: true,
        projectUpdateDisabled: false,
        canUpdateIPv4: true,
        ipv4Enabled: false,
      })
    ).toBe('Dedicated IPv4 address is only available for AWS projects')
  })

  it('returns the inactive-project message before other checks', () => {
    expect(
      getIPv4DisabledReason({
        isAws: true,
        isProjectActive: false,
        projectUpdateDisabled: true,
        canUpdateIPv4: false,
        ipv4Enabled: false,
      })
    ).toBe('Project must be active to update IPv4')
  })

  it('returns the updates-disabled message when project updates are blocked', () => {
    expect(
      getIPv4DisabledReason({
        isAws: true,
        isProjectActive: true,
        projectUpdateDisabled: true,
        canUpdateIPv4: true,
        ipv4Enabled: false,
      })
    ).toBe('Project updates are currently disabled')
  })

  it('returns the IPv6 requirement when IPv4 cannot be added yet', () => {
    expect(
      getIPv4DisabledReason({
        isAws: true,
        isProjectActive: true,
        projectUpdateDisabled: false,
        canUpdateIPv4: false,
        ipv4Enabled: false,
      })
    ).toBe('You can only add IPv4 when your project network configuration is set to IPv6')
  })

  it('returns undefined when IPv4 is already enabled', () => {
    expect(
      getIPv4DisabledReason({
        isAws: true,
        isProjectActive: true,
        projectUpdateDisabled: false,
        canUpdateIPv4: false,
        ipv4Enabled: true,
      })
    ).toBeUndefined()
  })
})

describe('getPitrDisabledReason', () => {
  it('returns the inactive-project message first', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
        hasHipaaAddon: true,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
      })
    ).toBe('Project must be active to update PITR')
  })

  it('returns the updates-disabled message before feature-specific checks', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: true,
        hasHipaaAddon: true,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
      })
    ).toBe('Project updates are currently disabled')
  })

  it('returns the HIPAA message when HIPAA is enabled', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
        hasHipaaAddon: true,
        sufficientPgVersion: true,
        isOrioleDbInAws: false,
      })
    ).toBe('PITR cannot be changed with HIPAA enabled')
  })

  it('returns the legacy-project message when the database version is too old', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
        hasHipaaAddon: false,
        sufficientPgVersion: false,
        isOrioleDbInAws: false,
      })
    ).toBe('Your project is too old to enable PITR')
  })

  it('returns the OrioleDB message when PITR is unsupported', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
        hasHipaaAddon: false,
        sufficientPgVersion: true,
        isOrioleDbInAws: true,
      })
    ).toBe('Point in time recovery is not supported with OrioleDB')
  })

  it('returns undefined when PITR can be updated', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
        hasHipaaAddon: false,
        sufficientPgVersion: true,
        isOrioleDbInAws: false,
      })
    ).toBeUndefined()
  })
})

describe('getCustomDomainDisabledReason', () => {
  it('returns the inactive-project message', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
      })
    ).toBe('Project must be active to update custom domain')
  })

  it('returns the updates-disabled message when applicable', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: true,
      })
    ).toBe('Project updates are currently disabled')
  })

  it('returns undefined when the custom domain panel can be opened', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
      })
    ).toBeUndefined()
  })
})

describe('getPitrAlertState', () => {
  it('prefers the HIPAA alert over other blocking reasons', () => {
    expect(
      getPitrAlertState({
        hasHipaaAddon: true,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
      })
    ).toBe('hipaa')
  })

  it('returns the legacy-project alert when HIPAA is not enabled', () => {
    expect(
      getPitrAlertState({
        hasHipaaAddon: false,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
      })
    ).toBe('legacy-project')
  })

  it('returns the OrioleDB alert when it is the remaining blocker', () => {
    expect(
      getPitrAlertState({
        hasHipaaAddon: false,
        sufficientPgVersion: true,
        isOrioleDbInAws: true,
      })
    ).toBe('orioledb')
  })

  it('returns undefined when no PITR alert is needed', () => {
    expect(
      getPitrAlertState({
        hasHipaaAddon: false,
        sufficientPgVersion: true,
        isOrioleDbInAws: false,
      })
    ).toBeUndefined()
  })
})
