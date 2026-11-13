import { type NextRequest } from 'next/server'

import { updateSession } from '@/registry/default/clients/nextjs/lib/supabase/proxy'

// On Next.js 16 and later, the shadcn CLI installs this file as proxy.ts. The default
// export works under either name, so the same file also runs as middleware on Next.js 15.
export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
