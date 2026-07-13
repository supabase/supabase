import { NextResponse } from 'next/server'

const SUPABASE_API_BASE = 'https://api.supabase.com'

// Allowlist of permitted endpoint patterns and their allowed methods.
// Pattern is matched against the path after /v1/ (e.g. "projects/abc123/database/query").
const ALLOWED_ENDPOINTS: Array<{ pattern: RegExp; methods: string[] }> = [
  // List all projects (used for membership verification)
  { pattern: /^v1\/projects$/, methods: ['GET'] },
  // Get a single project
  { pattern: /^v1\/projects\/[^/]+$/, methods: ['GET'] },
  // Database queries
  { pattern: /^v1\/projects\/[^/]+\/database\/query$/, methods: ['POST'] },
  // Auth config
  { pattern: /^v1\/projects\/[^/]+\/config\/auth$/, methods: ['GET', 'PATCH'] },
  // Secrets
  { pattern: /^v1\/projects\/[^/]+\/secrets$/, methods: ['GET', 'POST'] },
  { pattern: /^v1\/projects\/[^/]+\/secrets\/[^/]+$/, methods: ['DELETE'] },
  // Storage buckets
  { pattern: /^v1\/projects\/[^/]+\/storage\/buckets$/, methods: ['GET', 'POST'] },
  { pattern: /^v1\/projects\/[^/]+\/storage\/buckets\/[^/]+$/, methods: ['GET', 'PUT', 'DELETE'] },
  // Advisors / linting
  { pattern: /^v1\/projects\/[^/]+\/advisors\/lint$/, methods: ['GET'] },
  // Logs
  { pattern: /^v1\/projects\/[^/]+\/analytics\/endpoints\/logs\.[^/]+$/, methods: ['GET', 'POST'] },
  // Functions
  { pattern: /^v1\/projects\/[^/]+\/functions$/, methods: ['GET', 'POST'] },
  { pattern: /^v1\/projects\/[^/]+\/functions\/[^/]+$/, methods: ['GET', 'PATCH', 'DELETE'] },
  // Edge network / custom hostnames
  { pattern: /^v1\/projects\/[^/]+\/custom-hostname$/, methods: ['GET', 'POST', 'DELETE'] },
  // PostgREST config
  { pattern: /^v1\/projects\/[^/]+\/config\/postgrest$/, methods: ['GET', 'PATCH'] },
  // Database extensions
  { pattern: /^v1\/projects\/[^/]+\/database\/extensions$/, methods: ['GET', 'POST'] },
  // Database migrations
  { pattern: /^v1\/projects\/[^/]+\/database\/migrations$/, methods: ['GET'] },
]

function isAllowed(path: string, method: string): boolean {
  return ALLOWED_ENDPOINTS.some(
    (entry) => entry.pattern.test(path) && entry.methods.includes(method.toUpperCase())
  )
}

// Verify user has access to the project using their own token
async function verifyProjectAccess(callerToken: string, projectRef: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_API_BASE}/v1/projects`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${callerToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return false
    }

    const projects = await response.json()
    return Array.isArray(projects) && projects.some((p: any) => p.ref === projectRef)
  } catch {
    return false
  }
}

async function handleRequest(request: Request, params: { path: string[] }) {
  // 1. Require Bearer token from the caller
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Authorization header with Bearer token is required.' },
      { status: 401 }
    )
  }
  const callerToken = authHeader.slice(7)

  // 2. Build the upstream path
  const pathSegments = params.path
  const upstreamPath = pathSegments.join('/')

  // 3. Check allowlist
  if (!isAllowed(upstreamPath, request.method)) {
    return NextResponse.json(
      { message: 'This endpoint is not permitted.' },
      { status: 403 }
    )
  }

  // 4. Extract projectRef from path (second segment after "v1/projects/")
  // Path shape: v1/projects/{ref}/...
  const projectRef = pathSegments[2] ?? null

  // 5. If the path is project-scoped, verify the caller is a member
  if (projectRef && pathSegments[0] === 'v1' && pathSegments[1] === 'projects') {
    const hasAccess = await verifyProjectAccess(callerToken, projectRef)
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to access this project.' },
        { status: 403 }
      )
    }
  }

  // 6. Forward the request to the Supabase Management API using the caller's own token
  const url = new URL(request.url)
  const upstreamUrl = `${SUPABASE_API_BASE}/${upstreamPath}${url.search}`

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${callerToken}`)
  headers.set('Content-Type', 'application/json')

  const body =
    request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  })

  const responseBody = await upstreamResponse.text()
  const contentType = upstreamResponse.headers.get('Content-Type') ?? 'application/json'

  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': contentType,
    },
  })
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params)
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params)
}

export async function PUT(request: Request, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params)
}

export async function PATCH(request: Request, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params)
}

export async function DELETE(request: Request, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params)
}
