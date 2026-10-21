const legacyRouterStateResponse = () =>
  new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } })

export const GET = legacyRouterStateResponse
export const HEAD = legacyRouterStateResponse
export const POST = legacyRouterStateResponse
