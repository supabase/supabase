import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Define the cookie interface
interface Cookie {
  name: string
  value: string
  options?: CookieOptions
}

/**
 * Middleware function to handle authentication in Next.js applications using Supabase.
 * This function:
 * 1. Creates a Supabase client with server-side cookie handling
 * 2. Checks if the user is authenticated
 * 3. Redirects unauthenticated users to the login page if they try to access protected routes
 * 4. Properly manages cookies to maintain the user's session
 * @param request The incoming Next.js request
 * @returns A response with the proper cookies set for authentication
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Cookie[]) {
          // Create a new response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies only on the response object
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Get the current user, with error handling
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  
  // Log authentication errors (but don't block the request)
  if (error) {
    console.error('Auth error:', error.message)
  }

  // Redirect unauthenticated users to login page if they try to access protected routes
  // Public routes: /login and /auth paths are accessible without authentication
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
