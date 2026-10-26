import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { CARD_BRAND_ICON_FILES, getCardBrandIconUrl } from './PaymentMethods.utils'
import { BASE_PATH } from '@/lib/constants'

describe('getCardBrandIconUrl', () => {
  it('returns undefined for missing or unshipped brands and a URL for shipped ones', () => {
    expect(getCardBrandIconUrl('unionpay')).toBeUndefined()
    expect(getCardBrandIconUrl('unknown')).toBeUndefined()
    expect(getCardBrandIconUrl(null)).toBeUndefined()
    expect(getCardBrandIconUrl(undefined)).toBeUndefined()
    expect(getCardBrandIconUrl('visa')).toBe(`${BASE_PATH}/img/payment-methods/visa.png`)
    expect(getCardBrandIconUrl('diners')).toBe(`${BASE_PATH}/img/payment-methods/diners-club.png`)
  })

  it('only maps brands to files in public/img/payment-methods', () => {
    const iconDir = join(__dirname, '../../../../../public/img/payment-methods')
    const missingFiles = [...CARD_BRAND_ICON_FILES.values()].filter(
      (file) => !existsSync(join(iconDir, `${file}.png`))
    )

    expect(missingFiles).toEqual([])
  })
})
