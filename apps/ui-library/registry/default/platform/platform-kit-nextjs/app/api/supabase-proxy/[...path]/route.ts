import { NextResponse } from 'next/server'

async function forwardToSupabaseAPI(request: Request, method: string, params: { path: string[] }) {
  const { path } = params
  const apiPath = path.join('/')

  const url = new URL(request.url)
  url.protocol = 'https'
  url.hostname = 'api.supabase.com'
  url.port = '443'
  url.pathname = apiPath

  const projectRef = path[2]

  // Verify the requesting user is authenticated via their Supabase Management API token
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Authentication required.' },
      { status: 401 }
    )
  }
  const userToken = authHeader.slice(7)

  // All proxied requests must be scoped to a specific project
  if (!projectRef) {
    return NextResponse.json(
      { message: 'Project reference is required.' },
      { status: 403 }
    )
  }

  // Verify the user has access to this project using the documented GET /v1/projects endpoint
  const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${userToken}` },
  })
  if (!projectsResponse.ok) {
    return NextResponse.json(
      { message: 'You do not have permission to access this project.' },
      { status: 403 }
    )
  }
  const projects = await projectsResponse.json()
  const hasAccess = Array.isArray(projects) && projects.some((p: any) => p.id === projectRef)
  if (!hasAccess) {
    return NextResponse.json(
      { message: 'You do not have permission to access this project.' },
      { status: 403 }
    )
  }

  try {
    const forwardHeaders: HeadersInit = {
      // Forward the caller's own token, not the shared server token
      Authorization: `Bearer ${userToken}`,
    }

    // Copy relevant headers from the original request
    const contentType = request.headers.get('content-type')
    if (contentType) {
      forwardHeaders['Content-Type'] = contentType
    }

    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
    }

    // Include body for methods that support it
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) {
          fetchOptions.body = body
        }
      } catch (error) {
        // Handle cases where body is not readable
        console.warn('Could not read request body:', error)
      }
    }

    const response = await fetch(url, fetchOptions)

    // Get response body
    const responseText = await response.text()
    let responseData

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch {
      responseData = responseText
    }

    // Return the response with the same status
    return NextResponse.json(responseData, { status: response.status })
  } catch (error: any) {
    console.error('Supabase API proxy error:', error)
    const errorMessage = error.message || 'An unexpected error occurred.'
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'GET', resolvedParams)
}

export async function HEAD(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'HEAD', resolvedParams)
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'POST', resolvedParams)
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'PUT', resolvedParams)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'DELETE', resolvedParams)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return forwardToSupabaseAPI(request, 'PATCH', resolvedParams)
}
