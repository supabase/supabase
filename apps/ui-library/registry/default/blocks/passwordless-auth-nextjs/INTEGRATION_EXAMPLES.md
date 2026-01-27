# Integration Examples

Real-world examples of integrating passwordless email authentication into various Next.js application patterns.

## Table of Contents

1. [E-commerce Application](#e-commerce-application)
2. [SaaS Dashboard](#saas-dashboard)
3. [Blog Platform](#blog-platform)
4. [Multi-tenant Application](#multi-tenant-application)
5. [Progressive Web App](#progressive-web-app)

## E-commerce Application

### Scenario

Users need to sign in to view order history and checkout.

### Implementation

**app/checkout/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/checkout-form'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login?redirect=/checkout')
  }

  return <CheckoutForm user={user} />
}
```

**app/auth/login/page.tsx**

```tsx
'use client'

import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/account'

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push(redirect)
      }
    })

    return () => subscription.unsubscribe()
  }, [redirect, router])

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="text-muted-foreground">Sign in to view your cart and complete checkout</p>
      </div>
      <PasswordlessLoginForm />
    </div>
  )
}
```

## SaaS Dashboard

### Scenario

Multi-step onboarding after first login with role-based access.

### Implementation

**app/auth/login/page.tsx**

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Login form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>
          <PasswordlessLoginForm />
        </div>
      </div>

      {/* Right side - Marketing content */}
      <div className="hidden bg-gradient-to-br from-blue-500 to-purple-600 p-8 lg:block">
        <div className="flex h-full flex-col justify-center text-white">
          <h2 className="text-4xl font-bold">Secure, passwordless authentication</h2>
          <p className="mt-4 text-xl">No passwords to remember. Just enter your email.</p>
        </div>
      </div>
    </div>
  )
}
```

**lib/auth/check-onboarding.ts**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function checkOnboardingStatus() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  return {
    user,
    needsOnboarding: !profile?.onboarding_completed,
  }
}
```

**app/dashboard/page.tsx**

```tsx
import { checkOnboardingStatus } from '@/lib/auth/check-onboarding'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/dashboard-content'

export default async function DashboardPage() {
  const status = await checkOnboardingStatus()

  if (!status) {
    redirect('/auth/login?redirect=/dashboard')
  }

  if (status.needsOnboarding) {
    redirect('/onboarding')
  }

  return <DashboardContent user={status.user} />
}
```

## Blog Platform

### Scenario

Optional authentication for commenting, with guest browsing.

### Implementation

**app/blog/[slug]/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { BlogPost } from '@/components/blog-post'
import { CommentSection } from '@/components/comment-section'
import { AuthPrompt } from '@/components/auth-prompt'

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Get blog post (public)
  const { data: post } = await supabase.from('posts').select('*').eq('slug', params.slug).single()

  // Check auth status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <article className="container mx-auto max-w-3xl py-10">
      <BlogPost post={post} />

      {user ? (
        <CommentSection postId={post.id} user={user} />
      ) : (
        <AuthPrompt message="Sign in to leave a comment" />
      )}
    </article>
  )
}
```

**components/auth-prompt.tsx**

```tsx
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export function AuthPrompt({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-lg border bg-gray-50 p-6 text-center">
      <p className="mb-4 text-lg">{message}</p>
      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/signup">Create account</Link>
        </Button>
      </div>
    </div>
  )
}
```

## Multi-tenant Application

### Scenario

Different authentication flows for different organizations/tenants.

### Implementation

**app/[tenant]/auth/login/page.tsx**

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'
import { notFound } from 'next/navigation'
import { getTenantConfig } from '@/lib/tenants'

export default async function TenantLoginPage({ params }: { params: { tenant: string } }) {
  const tenantConfig = await getTenantConfig(params.tenant)

  if (!tenantConfig) {
    notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Tenant branding */}
        <div className="text-center">
          <img src={tenantConfig.logo} alt={tenantConfig.name} className="mx-auto h-12" />
          <h1 className="mt-4 text-2xl font-bold">{tenantConfig.name}</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <PasswordlessLoginForm />

        {/* Tenant-specific footer */}
        <div className="text-center text-sm text-muted-foreground">
          <a href={tenantConfig.supportUrl}>Need help?</a>
        </div>
      </div>
    </div>
  )
}
```

**lib/tenants.ts**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function getTenantConfig(slug: string) {
  const supabase = await createClient()

  const { data: tenant } = await supabase.from('tenants').select('*').eq('slug', slug).single()

  return tenant
}

export async function getUserTenant(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant:tenants(*)')
    .eq('user_id', userId)
    .single()

  return data?.tenant
}
```

**middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extract tenant from URL
  const pathParts = request.nextUrl.pathname.split('/')
  const tenant = pathParts[1]

  // Protected tenant routes
  if (pathParts[2] === 'dashboard' && !user) {
    return NextResponse.redirect(new URL(`/${tenant}/auth/login`, request.url))
  }

  // Verify user belongs to tenant
  if (user && pathParts[2] === 'dashboard') {
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('tenant_id, tenants(slug)')
      .eq('user_id', user.id)
      .single()

    if (membership?.tenants?.slug !== tenant) {
      return NextResponse.redirect(new URL(`/${tenant}/auth/login?error=unauthorized`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/:tenant/dashboard/:path*', '/:tenant/auth/:path*'],
}
```

## Progressive Web App

### Scenario

Offline-first PWA with authentication state persistence.

### Implementation

**lib/auth/auth-provider.tsx**

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**app/layout.tsx**

```tsx
import { AuthProvider } from '@/lib/auth/auth-provider'
import { OfflineIndicator } from '@/components/offline-indicator'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <AuthProvider>
          <OfflineIndicator />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**components/protected-route.tsx**

```tsx
'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

**app/offline/page.tsx**

```tsx
'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md p-6">
        <h1 className="text-2xl font-bold">You're offline</h1>
        <p className="mt-2 text-muted-foreground">
          No internet connection detected. Some features may be unavailable.
        </p>

        {user && (
          <div className="mt-4 rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-800">✓ You're signed in as {user.email}</p>
          </div>
        )}

        <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    </div>
  )
}
```

## Best Practices for Each Pattern

### E-commerce

- Store return URL for post-login redirect
- Show items in cart even when not logged in
- Prompt for login at checkout
- Remember cart items after login

### SaaS

- Implement role-based access control
- Check subscription status
- Handle team/organization memberships
- Redirect to onboarding for new users

### Blog/Content

- Allow anonymous browsing
- Gate premium content behind auth
- Show auth prompts contextually
- Remember reading position

### Multi-tenant

- Validate user belongs to tenant
- Custom branding per tenant
- Tenant-specific routing
- Isolated data per tenant

### PWA

- Cache authentication state
- Handle offline gracefully
- Show connection status
- Sync when online

## Common Patterns

### Redirect After Login

```tsx
// Store intended destination
const intendedUrl = request.nextUrl.pathname
redirect(`/auth/login?redirect=${encodeURIComponent(intendedUrl)}`)

// Restore after login
const redirect = searchParams.get('redirect') || '/dashboard'
router.push(redirect)
```

### Role-Based Access

```typescript
async function checkUserRole(userId: string, requiredRole: string) {
  const supabase = await createClient()

  const { data: user_role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  return user_role?.role === requiredRole
}
```

### Session Refresh

```typescript
// Automatically refresh session
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Session refreshed')
    }
  })

  return () => subscription.unsubscribe()
}, [])
```

## Testing Integration

```typescript
// __tests__/auth-integration.test.ts
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

describe('Passwordless Auth Integration', () => {
  it('should send magic link when email submitted', async () => {
    render(<PasswordlessLoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })
})
```

---

These examples demonstrate how to integrate passwordless authentication into various application architectures. Adapt them to your specific needs!
