import { NextRequest, NextResponse } from 'next/server'

// Allowlist of safe, read-only endpoints that can be proxied
const ALLOWED_ENDPOINTS: { method: string; pattern: RegExp }[] = [
  { method: 'GET', pattern: /^\/v1\/projects$/ },
  { method: 'GET', pattern: /^\/v1\/projects\/[^/]+$/ },
  { method: 'GET', pattern: /^\/v1\/projects\/[^/]+\/database\/query$/ },
  { method: 'POST', pattern: /^\/v1\/projects\/[^/]+\/database\/query$/ },
]

function isAllowedEndpoint(method: string, path: string): boolean {
  return ALLOWED_ENDPOINTS.some(
    (endpoint) => endpoint.method === method && endpoint.pattern.test(path)
  )
}

// Extract project ref from path if present (e.g., /v1/projects/{ref}/...)
function extractProjectRef(path: string): string | null {
  const match = path.match(/^\/v1\/projects\/([^/]+)/)
  return match ? match[1] : null
}

// Verify user has access to the project using their own token
async function verifyProjectAccess(callerToken: string, projectRef: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.supabase.com/v1/projects', {
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

async function forwardToSupabaseAPI(
  request: NextRequest,
  path: string[],
  callerToken: string
): Promise<NextResponse> {
  const apiPath = '/' + path.join('/')
  const url = `https://api.supabase.com${apiPath}`

  // Forward the request using the caller's own token (not the server token)
  const headers: HeadersInit = {
    Authorization: `Bearer ${callerToken}`,
    'Content-Type': 'application/json',
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const body = await request.text()
      if (body) {
        fetchOptions.body = body
      }
    } catch {
      // No body to forward
    }
  }

  const response = await fetch(url, fetchOptions)
  const data = await response.text()

  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

async function handleRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  try {
    // Require Bearer token authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization header with Bearer token is required.' },
        { status: 401 }
      )
    }
    const callerToken = authHeader.slice(7)

    const apiPath = '/' + path.join('/')

    // Check if the endpoint is in the allowlist
    if (!isAllowedEndpoint(request.method, apiPath)) {
      return NextResponse.json(
        { message: 'This endpoint is not allowed through the proxy.' },
        { status: 403 }
      )
    }

    // For project-scoped endpoints, verify the caller has access to the project
    const projectRef = extractProjectRef(apiPath)
    if (projectRef) {
      const hasAccess = await verifyProjectAccess(callerToken, projectRef)
      if (!hasAccess) {
        return NextResponse.json(
          { message: 'You do not have permission to access this project.' },
          { status: 403 }
        )
      }
    }

    return forwardToSupabaseAPI(request, path, callerToken)
  } catch (error: any) {
    console.error('Supabase proxy error:', error)
    return NextResponse.json(
      { message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
