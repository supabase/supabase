# Getting Started with Passwordless Authentication

This guide will help you set up passwordless authentication in your Next.js application in under 10 minutes.

## Prerequisites

- A Next.js 13+ application (App Router)
- A Supabase project ([create one here](https://supabase.com/dashboard))
- Node.js 18+ installed

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase Dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon/public key**

### Step 3: Configure Supabase Authentication

#### A. Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Ensure **Email** is enabled (it's enabled by default)

#### B. Configure Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Add your redirect URLs:

**For Development:**

```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/auth/confirm
  - http://localhost:3000/protected
```

**For Production:**

```
Site URL: https://yourdomain.com
Redirect URLs:
  - https://yourdomain.com/auth/confirm
  - https://yourdomain.com/protected
```

#### C. Configure Email Template (Choose One)

**Option 1: Magic Link (Default)**
Go to **Authentication** > **Email Templates** > **Magic Link**

Use this template:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

**Option 2: OTP**
Go to **Authentication** > **Email Templates** > **Magic Link** (yes, same template)

Replace with this template:

```html
<h2>One Time Login Code</h2>
<p>Please enter this code to sign in:</p>
<h1 style="font-size: 32px; letter-spacing: 4px;">{{ .Token }}</h1>
<p>This code will expire in 1 hour.</p>
```

**Option 3: Support Both**
You can create a more sophisticated template that shows both the token and link.

### Step 4: Create Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Step 5: Install UI Components

This block uses shadcn/ui components. Install the required components:

```bash
npx shadcn@latest add button card input label
```

### Step 6: Copy the Components

Copy the passwordless authentication components to your project:

```bash
# Create directories
mkdir -p components/auth
mkdir -p app/auth/{magic-link,otp,verify-otp,confirm,error,passwordless}
mkdir -p app/protected

# Copy components (adjust paths as needed)
cp registry/default/blocks/passwordless-auth-nextjs/components/*.tsx components/auth/
cp registry/default/blocks/passwordless-auth-nextjs/app/auth/*/page.tsx app/auth/
cp registry/default/blocks/passwordless-auth-nextjs/app/auth/confirm/route.ts app/auth/confirm/
```

Or manually copy the files from the `passwordless-auth-nextjs` block.

### Step 7: Add Middleware (Optional but Recommended)

Create or update `middleware.ts` in your project root:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
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

  // Protect routes that start with /protected
  if (request.nextUrl.pathname.startsWith('/protected') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/passwordless'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Step 8: Create Your First Login Page

Choose one of the following implementations:

#### Option A: PasswordlessLoginForm with Magic Link (Recommended)

Create `app/auth/login/page.tsx`:

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <PasswordlessLoginForm method="magic-link" />
      </div>
    </div>
  )
}
```

**Note:** You can change `method="magic-link"` to `method="otp"` to use OTP authentication instead.

#### Option B: Magic Link Only

Create `app/auth/login/page.tsx`:

```tsx
import { MagicLinkForm } from '@/components/auth/magic-link-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <MagicLinkForm />
      </div>
    </div>
  )
}
```

#### Option C: OTP Only

Create `app/auth/login/page.tsx`:

```tsx
import { OTPRequestForm } from '@/components/auth/otp-request-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <OTPRequestForm />
      </div>
    </div>
  )
}
```

### Step 9: Create a Protected Page

Create `app/protected/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Protected Page</h1>
        <p>Welcome, {user.email}!</p>
        <form action={handleSignOut}>
          <Button type="submit" variant="outline">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### Step 10: Test Your Implementation

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000/auth/login`

3. Enter your email address

4. Check your email for either:

   - A magic link (click it to sign in)
   - An OTP code (enter it on the verification page)

5. You should be redirected to `/protected` after successful authentication

## Common Issues and Solutions

### Issue: Email not arriving

**Solutions:**

- Check your spam folder
- Verify email provider settings in Supabase Dashboard
- Check Supabase logs: **Authentication** > **Logs**

### Issue: "Invalid redirect URL" error

**Solutions:**

- Verify the redirect URL is whitelisted in Supabase Dashboard
- Ensure the URL matches exactly (including http/https)
- Check for trailing slashes

### Issue: "User not found" error

**Solutions:**

- Set `shouldCreateUser: true` to allow automatic user creation
- Or manually create the user in Supabase Dashboard first

### Issue: Middleware not working

**Solutions:**

- Ensure middleware.ts is in the project root
- Check the matcher configuration
- Restart your development server

## Next Steps

1. **Customize the UI**: Modify the components to match your brand
2. **Add Analytics**: Track authentication events
3. **Configure Email Templates**: Customize the email design
4. **Add Social Auth**: Combine with OAuth providers
5. **Implement Role-Based Access**: Add user roles and permissions

## Additional Resources

- [Full Documentation](./README.md)
- [Usage Guide](./USAGE.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)

## Need Help?

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Supabase Documentation](https://supabase.com/docs)

---

**Congratulations!** You now have passwordless email authentication set up in your Next.js application. 🎉
