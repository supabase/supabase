import { describe, expect, it } from 'vitest'

import {
  formatBillingAddress,
  formatTaxId,
  getCardBrandName,
  getCardExpiry,
  getCardTitle,
} from './PlanUpdatePayment.utils'

describe('getCardTitle', () => {
  it('pairs the brand with the last four digits', () => {
    expect(getCardTitle({ brand: 'visa', last4: '4242' })).toBe('Visa •••• 4242')
  })

  it('falls back to the brand alone without digits', () => {
    expect(getCardTitle({ brand: 'mastercard' })).toBe('Mastercard')
  })

  it('names a card with nothing known about it', () => {
    expect(getCardTitle(undefined)).toBe('Card')
  })
})

describe('getCardBrandName', () => {
  it('spells out brands whose identifier is an abbreviation', () => {
    expect(getCardBrandName('amex')).toBe('American Express')
  })

  it('capitalizes a brand it has no name for', () => {
    expect(getCardBrandName('cartes_bancaires')).toBe('Cartes_bancaires')
  })
})

describe('getCardExpiry', () => {
  it('pads the month and shortens the year', () => {
    expect(getCardExpiry({ exp_month: 8, exp_year: 2028 })).toBe('08/28')
  })

  it('returns null when the expiry is incomplete', () => {
    expect(getCardExpiry({ exp_month: 8 })).toBeNull()
    expect(getCardExpiry(undefined)).toBeNull()
  })
})

describe('formatBillingAddress', () => {
  it('puts the postal code next to the city and leaves out a country the city already names', () => {
    expect(
      formatBillingAddress({
        line1: '60 Telok Blangah Heights',
        city: 'Singapore',
        postal_code: '100060',
        country: 'SG',
      })
    ).toBe('60 Telok Blangah Heights, Singapore 100060')
  })

  it('includes line 2, state and the country name when they are set', () => {
    expect(
      formatBillingAddress({
        line1: '1 Main St',
        line2: 'Suite 4',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94107',
        country: 'US',
      })
    ).toBe('1 Main St, Suite 4, San Francisco, CA 94107, United States')
  })

  it('skips fields that are null or empty', () => {
    expect(
      formatBillingAddress({
        line1: 'Rue de Rivoli 1',
        line2: null,
        city: 'Paris',
        state: '',
        postal_code: null,
        country: 'FR',
      })
    ).toBe('Rue de Rivoli 1, Paris, France')
  })
})

describe('formatTaxId', () => {
  it('leads with the name the billing form uses for the tax ID type', () => {
    expect(formatTaxId({ type: 'sg_gst', country: 'SG', value: 'M12345678X' }, 'SG')).toBe(
      'SG GST M12345678X'
    )
  })

  it('tells apart tax ID types that share a stored type by the billing country', () => {
    expect(formatTaxId({ type: 'gb_vat', country: 'GB', value: 'GB123456789' }, 'GB')).toBe(
      'UK VAT GB123456789'
    )
    expect(formatTaxId({ type: 'gb_vat', country: 'GB', value: 'GB123456789' }, 'IM')).toBe(
      'IM VAT GB123456789'
    )
  })

  it('falls back to the stored type for one the form does not list', () => {
    expect(formatTaxId({ type: 'made_up_id', country: 'SG', value: '42' }, 'SG')).toBe(
      'made_up_id 42'
    )
  })
})
