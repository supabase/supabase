import { sanitizeTaxID } from 'components/interfaces/Organization/BillingSettings/TaxID/TaxID.utils'

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

    const sanitizedID = sanitizeTaxID(austriaTaxID)
    expect(sanitizedID.value).toBe('ATU12345678')
  })

  test('should check that EU prefix is correct', () => {
    const austriaTaxID = {
      id: 'txi_1LoPlYJDPojXS6LNVd1FOTk2',
      type: 'eu_vat',
      value: 'ATU12345678',
      name: 'AT VAT',
    }

    const sanitizedID = sanitizeTaxID(austriaTaxID)
    expect(sanitizedID.value).toBe('ATU12345678')
  })

  test('should not prefix an non-EU tax ID', () => {
    const unitedStatesID = {
      id: 'txi_1LoPlYJDPojXS6LNVd1FOTk2',
      type: 'us_ein',
      value: '12-3456789',
      name: 'US EIN',
    }

    const sanitizedID = sanitizeTaxID(unitedStatesID)
    expect(sanitizedID.value).toBe('12-3456789')
  })
})
