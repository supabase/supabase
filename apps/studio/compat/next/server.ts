// Vite-side compat for `next/server`. Workspace source uses `NextResponse`
// (only `.json()`) in two App Router routes and `NextRequest` as a type-only
// import elsewhere. Extend this file if more surface is needed.

export const NextResponse = {
  json: (data: unknown, init?: ResponseInit) => Response.json(data, init),
}

// NextRequest extends Request with Next-specific fields (nextUrl, cookies,
// ip, geo). None of our workspace source reads those fields at runtime —
// the only imports are type-only. Aliasing to Request keeps TypeScript
// happy without pulling in Next internals.
export type NextRequest = Request
