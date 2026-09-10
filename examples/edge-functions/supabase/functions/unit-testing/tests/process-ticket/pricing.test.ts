// supabase/functions/tests/process-ticket/pricing.test.ts
import { assertEquals } from 'jsr:@std/assert'
import { describe, it } from 'jsr:@std/testing/bdd'

import { AGE_TIERS, applyTicketDiscount, getAgeDiscount } from '../../process-ticket/pricing.ts'

describe('getAgeDiscount', () => {
  it('should return valid discount for children', () => {
    const ages = [0, 5, 8]
    ages.forEach((age) => {
      const discount = getAgeDiscount(age)
      assertEquals(discount, AGE_TIERS.CHILDREN)
    })
  })

  it('should return valid discount for young people (9-17)', () => {
    const ages = [9, 12, 17]
    ages.forEach((age) => {
      const discount = getAgeDiscount(age)
      assertEquals(discount, AGE_TIERS.YOUNG)
    })
  })

  it('should return valid discount for adults', () => {
    const ages = [18, 35, 80]
    ages.forEach((age) => {
      const discount = getAgeDiscount(age)
      assertEquals(discount, AGE_TIERS.ADULT)
    })
  })
})

describe('applyTicketDiscount', () => {
  it('kids have free access', () => {
    const price = applyTicketDiscount(10, 8)
    assertEquals(price, 0)
  })

  it('young people get 20% off', () => {
    const ages = [9, 12, 17]
    ages.forEach((age) => {
      const price = applyTicketDiscount(10, age)
      assertEquals(price, 8) // 10 - 20% = 8
    })
  })

  it('adults pay full price', () => {
    const ages = [18, 35, 80]
    ages.forEach((age) => {
      const price = applyTicketDiscount(10, age)
      assertEquals(price, 10)
    })
  })
})
