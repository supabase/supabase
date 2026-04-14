import { describe, expect, test } from 'vitest'

import { TAX_IDS } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.constants'
import {
  getEffectiveTaxCountry,
  resolveStoredTaxId,
  sanitizeTaxIdValue,
} from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.utils'

/**
 * We're sanitizing EU tax ids. Stripe expects a prefixed tax id (ATU12345678),
 * but users might not realize this and enter only the numbers (12345678) without the
 * country code prefix.
 *
 * Our sanitize function should handle 3 cases:
 *  1. take an un-prefixed tax id (12345678) and add the country prefix to it (ATU12345678)
 *  2. take a correctly prefixed tax id (ATU12345678) and just pass it through
 *  3. take a non-EU tax id and just pass it through
 */
describe('TaxID utils: sanitizeTaxID', () => {
  test('should prefix an EU tax ID correctly', () => {
    const austriaTaxID = {
      id: 'txi_1LoPlYJDPojXS6LNVd1FOTk2',
      type: 'eu_vat',
      value: '12345678',
      name: 'AT VAT',
    }

    const sanitizedID = sanitizeTaxIdValue(austriaTaxID)
    expect(sanitizedID).toBe('ATU12345678')
  })

  test('should check that EU prefix is correct', () => {
    const austriaTaxID = {
      id: 'txi_1LoPlYJDPojXS6LNVd1FOTk2',
      type: 'eu_vat',
      value: 'ATU12345678',
      name: 'AT VAT',
    }

    const sanitizedID = sanitizeTaxIdValue(austriaTaxID)
    expect(sanitizedID).toBe('ATU12345678')
  })

  test('should not prefix an non-EU tax ID', () => {
    const unitedStatesID = {
      id: 'txi_1LoPlYJDPojXS6LNVd1FOTk2',
      type: 'us_ein',
      value: '12-3456789',
      name: 'US EIN',
    }

    const sanitizedID = sanitizeTaxIdValue(unitedStatesID)
    expect(sanitizedID).toBe('12-3456789')
  })
})

describe('TaxID utils: getEffectiveTaxCountry', () => {
  test('returns countryIso2 when no override is set', () => {
    const ukVat = TAX_IDS.find((t) => t.name === 'UK VAT')!
    expect(getEffectiveTaxCountry(ukVat)).toBe('GB')
  })

  test('returns taxCountryIso2 when override is set', () => {
    const imVat = TAX_IDS.find((t) => t.name === 'IM VAT')!
    expect(getEffectiveTaxCountry(imVat)).toBe('GB')
  })
})

describe('TaxID utils: resolveStoredTaxId', () => {
  test('resolves GB customer to UK VAT with billingCountry', () => {
    const ukVat = TAX_IDS.find((t) => t.name === 'UK VAT')!
    expect(resolveStoredTaxId('gb_vat', 'GB', 'GB')).toBe(ukVat)
  })

  test('resolves IM customer to IM VAT with billingCountry', () => {
    const imVat = TAX_IDS.find((t) => t.name === 'IM VAT')!
    expect(resolveStoredTaxId('gb_vat', 'GB', 'IM')).toBe(imVat)
  })

  test('resolves GB customer to UK VAT without billingCountry', () => {
    // Without billingCountry, falls back to countryIso2 match — UK VAT has countryIso2 'GB'
    const ukVat = TAX_IDS.find((t) => t.name === 'UK VAT')!
    expect(resolveStoredTaxId('gb_vat', 'GB')).toBe(ukVat)
  })

  test('returns undefined for unknown type', () => {
    expect(resolveStoredTaxId('unknown_type', 'XX')).toBeUndefined()
  })
})
