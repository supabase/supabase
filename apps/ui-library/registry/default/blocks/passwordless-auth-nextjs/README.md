# Passwordless Authentication for Next.js

A complete passwordless authentication solution for Next.js applications using Supabase Auth. This block includes support for both Magic Link and OTP (One-Time Password) login methods.

## Features

- **Magic Link Login**: Users receive a clickable link in their email to sign in
- **OTP Login**: Users receive a 6-digit code to enter for authentication
- **Combined Form**: Single form that supports both methods
- **Auto Sign-Up**: Automatically creates user accounts on first login (configurable)
- **Protected Routes**: Middleware-protected pages requiring authentication
- **Error Handling**: Comprehensive error states and user feedback
- **TypeScript**: Full type safety with TypeScript

## Components

### 1. MagicLinkForm

A standalone form for Magic Link authentication.

```tsx
import { MagicLinkForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/magic-link-form'

export default function LoginPage() {
  return <MagicLinkForm />
}
```

### 2. OTPRequestForm

Request a one-time password to be sent via email.

```tsx
import { OTPRequestForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-request-form'

export default function OTPPage() {
  return <OTPRequestForm />
}
```

### 3. OTPVerifyForm

Verify the OTP code received via email.

```tsx
import { OTPVerifyForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-verify-form'

export default function VerifyPage() {
  return <OTPVerifyForm />
}
```

### 4. PasswordlessLoginForm (Recommended)

A unified form that supports both Magic Link and OTP authentication. Use the `method` prop to specify which authentication method to use.

```tsx
import { PasswordlessLoginForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/passwordless-login-form'

export default function LoginPage() {
  return <PasswordlessLoginForm method="magic-link" />
}
```

**Props:**

- `method?: 'magic-link' | 'otp'` - Authentication method (default: `'magic-link'`)

**Examples:**

```tsx
// Magic Link authentication
<PasswordlessLoginForm method="magic-link" />

// OTP authentication
<PasswordlessLoginForm method="otp" />
```

## Setup

### 1. Environment Variables

Ensure you have the following environment variables in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Configuration

#### Configure Redirect URLs

In your Supabase Dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/protected`

#### Email Templates

For **Magic Link** (default):
The default email template works out of the box. For PKCE flow, update the Magic Link email template:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

For **OTP**:
Update the Magic Link email template to show the OTP code:

```html
<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
```

### 3. Middleware

Copy the included `middleware.ts` to your project root to protect routes:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... (see middleware.ts in this block)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## Usage Examples

### Basic Magic Link Login

```tsx
// app/auth/login/page.tsx
import { MagicLinkForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/magic-link-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <MagicLinkForm />
    </div>
  )
}
```

### OTP Flow

```tsx
// app/auth/otp/page.tsx
import { OTPRequestForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-request-form'

export default function OTPPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <OTPRequestForm />
    </div>
  )
}

// app/auth/verify-otp/page.tsx
import { OTPVerifyForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-verify-form'
import { Suspense } from 'react'

export default function VerifyPage() {
  return (
    <Suspense>
      <div className="flex min-h-screen items-center justify-center">
        <OTPVerifyForm />
      </div>
    </Suspense>
  )
}
```

### Combined Passwordless Form (Recommended)

```tsx
// app/auth/passwordless/page.tsx
import { PasswordlessLoginForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/passwordless-login-form'

export default function PasswordlessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PasswordlessLoginForm />
    </div>
  )
}
```

## Configuration Options

### Disable Auto Sign-Up

If you want to prevent automatic user creation, set `shouldCreateUser` to `false`:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false, // Only allow existing users to sign in
  },
})
```

### Custom Redirect

Customize where users are redirected after authentication:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`, // Custom redirect
  },
})
```

### OTP Expiration

By default:

- OTPs can be requested once every 60 seconds
- OTPs expire after 1 hour

Configure these in your Supabase Dashboard:
**Authentication** > **Providers** > **Email** > **Email OTP Expiration**

## Protected Routes

Create protected pages that require authentication:

```tsx
// app/protected/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/passwordless')
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user.email}!</p>
    </div>
  )
}
```

## Security Considerations

1. **Rate Limiting**: Supabase enforces rate limits (1 request per 60 seconds by default)
2. **Expiration**: Magic Links and OTPs expire after 1 hour
3. **HTTPS Required**: Always use HTTPS in production
4. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### Magic Link not working

1. Check your email template includes the correct redirect URL
2. Verify redirect URLs are configured in Supabase Dashboard
3. Check email spam folder

### OTP not arriving

1. Verify email template is configured to show `{{ .Token }}`
2. Check Supabase Auth email provider settings
3. Check rate limiting (wait 60 seconds between requests)

### Authentication errors

1. Check browser console for detailed error messages
2. Verify environment variables are set correctly
3. Ensure Supabase client is initialized properly

## Learn More

- [Supabase Passwordless Auth Docs](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Magic Link Documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless#with-magic-link)
- [OTP Documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless#with-otp)
