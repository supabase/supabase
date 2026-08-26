import { NextResponse } from 'next/server'

import { buildPricingJson } from '@/lib/pricing-json'

export const dynamic = 'force-dynamic'

const PRICING_JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

export async function GET() {
  return NextResponse.json(buildPricingJson(), { headers: PRICING_JSON_HEADERS })
}
