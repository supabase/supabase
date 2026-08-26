import { describe, expect, it } from 'vitest'

import { buildPricingJson, parseUsdString } from './pricing-json'

describe('parseUsdString', () => {
  it('parses plain dollar amounts', () => {
    expect(parseUsdString('$10')).toBe(10)
    expect(parseUsdString('$1,870')).toBe(1870)
    expect(parseUsdString('$0.024')).toBe(0.024)
  })

  it('throws on anything that is not a bare dollar amount', () => {
    expect(() => parseUsdString('Contact Us')).toThrow('Unparseable price')
    expect(() => parseUsdString('10')).toThrow('Unparseable price')
    expect(() => parseUsdString('$10/mo')).toThrow('Unparseable price')
    expect(() => parseUsdString('')).toThrow('Unparseable price')
  })
})

describe('buildPricingJson', () => {
  const payload = buildPricingJson()
  const planKeys = ['free', 'pro', 'team', 'enterprise']

  it('declares itself informational', () => {
    expect(payload.description).toContain('not a billing API')
    expect(payload.source).toBe('https://supabase.com/pricing')
    expect(payload.currency).toBe('USD')
  })

  it('covers all four plans with billing semantics', () => {
    expect(payload.plans.map((p) => p.id)).toEqual(planKeys)
    for (const plan of payload.plans) {
      expect(typeof plan.spendCapAvailable).toBe('boolean')
      if (plan.id === 'enterprise') {
        expect(plan.priceMonthly).toBeNull()
        expect(plan.contactSales).toBe(true)
      } else {
        expect(Number.isFinite(plan.priceMonthly)).toBe(true)
      }
    }
  })

  it('parses every compute tier with numeric prices', () => {
    expect(payload.compute.tiers.length).toBeGreaterThanOrEqual(10)
    const contactTiers = payload.compute.tiers.filter((t) => t.contactSales)
    expect(contactTiers).toHaveLength(1)
    for (const tier of payload.compute.tiers) {
      if (tier.contactSales) {
        expect(tier.priceMonthly).toBeNull()
        continue
      }
      expect(Number.isFinite(tier.priceMonthly)).toBe(true)
      expect(tier.priceMonthly!).toBeGreaterThan(0)
      expect(Number.isFinite(tier.memoryGb)).toBe(true)
      expect(Number.isFinite(tier.connectionsDirect)).toBe(true)
      expect(Number.isFinite(tier.connectionsPooler)).toBe(true)
    }
  })

  it('carries exactly the gp3 and io2 disk types with numeric rates', () => {
    expect(payload.disk.types.map((d) => d.type)).toEqual(['gp3', 'io2'])
    const gp3 = payload.disk.types[0]
    expect(gp3.includedPerProject).toEqual({ sizeGb: 8, iops: 3000, throughputMBps: 125 })
    expect(gp3.perUnitMonth.iops).toBeGreaterThan(0)
    expect(gp3.perUnitMonth.throughputMBps).toBeGreaterThan(0)
    const io2 = payload.disk.types[1]
    expect(io2.includedPerProject).toBeNull()
    expect(io2.perUnitMonth.throughputMBps).toBeNull()
  })

  it('gives every meter a scope, positive price, and complete includedByPlan', () => {
    expect(payload.meters.length).toBeGreaterThanOrEqual(15)
    for (const meter of payload.meters) {
      expect(meter.scope).toMatch(/^per-/)
      expect(meter.pricePerUnitQuantity).toBeGreaterThan(0)
      expect(meter.unitQuantity).toBeGreaterThan(0)
      expect(Object.keys(meter.includedByPlan).sort()).toEqual([...planKeys].sort())
    }
  })

  it('keeps unified egress out of any product bucket', () => {
    const egress = payload.meters.find((m) => m.id === 'egress')
    expect(egress?.unified).toBe(true)
    expect(egress?.product).toBeNull()
  })

  it('lists every addon with per-project scope and availability', () => {
    expect(payload.addons.map((a) => a.id).sort()).toEqual([
      'advancedMfaPhone',
      'customDomain',
      'logDrain',
      'pitr',
    ])
    for (const addon of payload.addons) {
      expect(addon.scope).toBe('per-project')
      expect(Object.keys(addon.availability).sort()).toEqual([...planKeys].sort())
    }
  })
})
