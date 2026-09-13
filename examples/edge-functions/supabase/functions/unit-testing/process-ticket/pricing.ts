// supabase/functions/process-ticket/pricing.ts
export const AGE_TIERS = {
  CHILDREN: 1, // free access
  YOUNG: 0.2, // 20% off (ages 9-17)
  ADULT: 0, // no discount
}

export function getAgeDiscount(age: number) {
  if (age <= 8) {
    return AGE_TIERS.CHILDREN
  }

  if (age > 8 && age < 18) {
    return AGE_TIERS.YOUNG
  }

  return AGE_TIERS.ADULT
}

export function applyTicketDiscount(price: number, age: number) {
  const discount = getAgeDiscount(age)
  return price - price * discount
}
