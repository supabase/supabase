import { describe, expect, it } from 'vitest'

import {
  getComplianceRequirements,
  isNetworkRestrictionsRequirementMet,
  isPitrRequirementMet,
  isSslEnforcementRequirementMet,
} from './ComplianceConfig.utils'

describe('isSslEnforcementRequirementMet', () => {
  it('is met when applied successfully and database enforcement is on', () => {
    expect(
      isSslEnforcementRequirementMet({
        appliedSuccessfully: true,
        currentConfig: { database: true },
      } as any)
    ).toBe(true)
  })

  it('is not met when database enforcement is off', () => {
    expect(
      isSslEnforcementRequirementMet({
        appliedSuccessfully: true,
        currentConfig: { database: false },
      } as any)
    ).toBe(false)
  })

  it('is not met when data is undefined', () => {
    expect(isSslEnforcementRequirementMet(undefined)).toBe(false)
  })
})

describe('isNetworkRestrictionsRequirementMet', () => {
  it('is met when at least one restricted CIDR is configured', () => {
    expect(
      isNetworkRestrictionsRequirementMet({ config: { dbAllowedCidrs: ['1.2.3.4/32'] } } as any)
    ).toBe(true)
  })

  it('is not met when no CIDRs are configured', () => {
    expect(isNetworkRestrictionsRequirementMet({ config: { dbAllowedCidrs: [] } } as any)).toBe(
      false
    )
  })

  it('is met when the allowlist is empty but fully applied (all access blocked)', () => {
    expect(
      isNetworkRestrictionsRequirementMet({
        config: { dbAllowedCidrs: [], dbAllowedCidrsV6: [] },
        status: 'applied',
      } as any)
    ).toBe(true)
  })

  it('is not met when the allowlist is empty and unset', () => {
    expect(
      isNetworkRestrictionsRequirementMet({ config: { dbAllowedCidrs: [] }, status: '' } as any)
    ).toBe(false)
  })

  it('is not met when the allowlist is empty but only staged, not applied', () => {
    expect(
      isNetworkRestrictionsRequirementMet({
        config: { dbAllowedCidrs: [] },
        status: 'stored',
      } as any)
    ).toBe(false)
  })

  it('is not met when the allowlist is wide open', () => {
    expect(
      isNetworkRestrictionsRequirementMet({ config: { dbAllowedCidrs: ['0.0.0.0/0'] } } as any)
    ).toBe(false)
  })

  it('is not met when IPv4 is empty/applied but IPv6 is wide open', () => {
    expect(
      isNetworkRestrictionsRequirementMet({
        config: { dbAllowedCidrs: [], dbAllowedCidrsV6: ['::/0'] },
        status: 'applied',
      } as any)
    ).toBe(false)
  })

  it('is not met when IPv6 is wide open even if IPv4 has real restrictions', () => {
    expect(
      isNetworkRestrictionsRequirementMet({
        config: { dbAllowedCidrs: ['1.2.3.4/32'], dbAllowedCidrsV6: ['::/0'] },
        status: 'applied',
      } as any)
    ).toBe(false)
  })

  it('is met when both IPv4 and IPv6 have real, non-wide-open restrictions', () => {
    expect(
      isNetworkRestrictionsRequirementMet({
        config: { dbAllowedCidrs: ['1.2.3.4/32'], dbAllowedCidrsV6: ['2001:db8::/32'] },
        status: 'applied',
      } as any)
    ).toBe(true)
  })

  it('is not met when data is undefined', () => {
    expect(isNetworkRestrictionsRequirementMet(undefined)).toBe(false)
  })
})

describe('isPitrRequirementMet', () => {
  it('is met when pitr_enabled is true', () => {
    expect(isPitrRequirementMet({ pitr_enabled: true } as any)).toBe(true)
  })

  it('is not met when pitr_enabled is false', () => {
    expect(isPitrRequirementMet({ pitr_enabled: false } as any)).toBe(false)
  })

  it('is not met when data is undefined', () => {
    expect(isPitrRequirementMet(undefined)).toBe(false)
  })
})

describe('getComplianceRequirements', () => {
  it('builds a requirement per compliance check with project-scoped links', () => {
    const requirements = getComplianceRequirements({
      projectRef: 'my-project',
      sslEnforcement: { appliedSuccessfully: true, currentConfig: { database: true } } as any,
      isLoadingSslEnforcement: false,
      networkRestrictions: { config: { dbAllowedCidrs: [] } } as any,
      isLoadingNetworkRestrictions: true,
      backups: { pitr_enabled: false } as any,
      isLoadingBackups: false,
    })

    expect(requirements).toEqual([
      {
        id: 'ssl-enforcement',
        label: 'Enforce SSL on incoming connections',
        href: '/project/my-project/settings/database#ssl-configuration',
        isMet: true,
        isLoading: false,
      },
      {
        id: 'network-restrictions',
        label: 'Restrict database access by IP address',
        href: '/project/my-project/settings/database#network-restrictions',
        isMet: false,
        isLoading: true,
      },
      {
        id: 'pitr',
        label: 'Enable point-in-time recovery backups',
        href: '/project/my-project/database/backups/pitr',
        isMet: false,
        isLoading: false,
      },
    ])
  })
})
