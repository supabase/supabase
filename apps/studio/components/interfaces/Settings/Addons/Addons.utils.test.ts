import { describe, expect, it } from 'vitest'

import {
  countReadReplicas,
  getActiveCountLabel,
  getCustomDomainDisabledReason,
  getAdvancedDiskDetail,
  getLowestPaidPrice,
  isAdvancedDiskEnabled,
  getIPv4DisabledReason,
  getPitrAlertState,
  getPitrDisabledReason,
  isComputeAddonEnabled,
} from './Addons.utils'

describe('getIPv4DisabledReason', () => {
  it('returns the High Availability message before other checks', () => {
    expect(
      getIPv4DisabledReason({
        isAws: false,
        isProjectActive: false,
        projectUpdateDisabled: true,
        canUpdateIPv4: false,
        ipv4Enabled: false,
        isHighAvailability: true,
      })
    ).toBe('Dedicated IPv4 address is unavailable on High Availability projects')
  })

  it('returns the AWS-only message for non-AWS projects', () => {
    expect(
      getIPv4DisabledReason({
        isAws: false,
        isProjectActive: true,
        projectUpdateDisabled: false,
        canUpdateIPv4: true,
        ipv4Enabled: false,
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
      })
    ).toBeUndefined()
  })
})

describe('getPitrDisabledReason', () => {
  it('returns the High Availability message before other checks', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
        hasHipaaAddon: true,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
        isHighAvailability: true,
      })
    ).toBe('Point in time recovery is unavailable on High Availability projects')
  })

  it('returns the inactive-project message first', () => {
    expect(
      getPitrDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
        hasHipaaAddon: true,
        sufficientPgVersion: false,
        isOrioleDbInAws: true,
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
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
        isHighAvailability: false,
      })
    ).toBeUndefined()
  })
})

describe('getCustomDomainDisabledReason', () => {
  it('returns the High Availability message before other checks', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
        isHighAvailability: true,
      })
    ).toBe('Custom domain is unavailable on High Availability projects')
  })

  it('returns the inactive-project message', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: false,
        projectUpdateDisabled: true,
        isHighAvailability: false,
      })
    ).toBe('Project must be active to update custom domain')
  })

  it('returns the updates-disabled message when applicable', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: true,
        isHighAvailability: false,
      })
    ).toBe('Project updates are currently disabled')
  })

  it('returns undefined when the custom domain panel can be opened', () => {
    expect(
      getCustomDomainDisabledReason({
        isProjectActive: true,
        projectUpdateDisabled: false,
        isHighAvailability: false,
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

  it('returns the non-compliant alert when HIPAA is enabled without 28-day PITR', () => {
    expect(
      getPitrAlertState({
        hasHipaaAddon: true,
        hasHipaaCompliantPitr: false,
        sufficientPgVersion: true,
        isOrioleDbInAws: false,
      })
    ).toBe('hipaa-non-compliant')
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

describe('isComputeAddonEnabled', () => {
  it('treats the default ci_micro size and missing sizes as disabled', () => {
    expect(isComputeAddonEnabled('ci_micro')).toBe(false)
    expect(isComputeAddonEnabled(undefined)).toBe(false)
    expect(isComputeAddonEnabled(null)).toBe(false)
  })

  it('treats any other size as enabled', () => {
    expect(isComputeAddonEnabled('ci_small')).toBe(true)
    expect(isComputeAddonEnabled('ci_xlarge')).toBe(true)
  })
})

describe('getActiveCountLabel', () => {
  it('formats the active count', () => {
    expect(getActiveCountLabel(2)).toBe('2 active')
  })
})

describe('getLowestPaidPrice', () => {
  const available = [
    {
      type: 'compute_instance',
      variants: [
        { identifier: 'ci_micro', price: 0 },
        { identifier: 'ci_small', price: 15 },
        { identifier: 'ci_medium', price: 60 },
      ],
    },
  ]

  it('returns the lowest price above zero', () => {
    expect(getLowestPaidPrice(available, 'compute_instance')).toBe(15)
  })

  it('skips excluded variants', () => {
    expect(getLowestPaidPrice(available, 'compute_instance', ['ci_small'])).toBe(60)
  })

  it('returns undefined when the add-on type has no paid variants', () => {
    expect(getLowestPaidPrice(available, 'pitr')).toBeUndefined()
  })
})

describe('countReadReplicas', () => {
  it('excludes the primary database', () => {
    const databases = [{ identifier: 'abc' }, { identifier: 'abc-replica-1' }]
    expect(countReadReplicas(databases, 'abc')).toBe(1)
  })

  it('returns 0 when only the primary exists', () => {
    expect(countReadReplicas([{ identifier: 'abc' }], 'abc')).toBe(0)
  })
})

describe('isAdvancedDiskEnabled', () => {
  it('is disabled without disk attributes', () => {
    expect(isAdvancedDiskEnabled(undefined)).toBe(false)
  })

  it('is disabled for gp3 with included IOPS and throughput', () => {
    expect(isAdvancedDiskEnabled({ type: 'gp3', iops: 3000, throughput_mibps: 125 })).toBe(false)
  })

  it('is enabled for gp3 with extra IOPS or throughput', () => {
    expect(isAdvancedDiskEnabled({ type: 'gp3', iops: 4000, throughput_mibps: 125 })).toBe(true)
    expect(isAdvancedDiskEnabled({ type: 'gp3', iops: 3000, throughput_mibps: 250 })).toBe(true)
  })

  it('is enabled for io2', () => {
    expect(isAdvancedDiskEnabled({ type: 'io2', iops: 1500 })).toBe(true)
  })
})

describe('getAdvancedDiskDetail', () => {
  it('describes the configured disk when enabled', () => {
    expect(getAdvancedDiskDetail({ type: 'io2', iops: 2000 })).toBe('High-performance · 2,000 IOPS')
    expect(getAdvancedDiskDetail({ type: 'gp3', iops: 4000, throughput_mibps: 200 })).toBe(
      '4,000 IOPS · 200 MiB/s'
    )
  })

  it('falls back to usage based when not enabled', () => {
    expect(getAdvancedDiskDetail({ type: 'gp3', iops: 3000, throughput_mibps: 125 })).toBe(
      'Usage based'
    )
  })
})
