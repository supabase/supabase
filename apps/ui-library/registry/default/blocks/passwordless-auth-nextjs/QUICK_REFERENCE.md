# Quick Reference - Passwordless Authentication

## Components Overview

| Component               | Purpose                                 | Use Case                         |
| ----------------------- | --------------------------------------- | -------------------------------- |
| `MagicLinkForm`         | Email-only form that sends a magic link | Simple, one-click authentication |
| `OTPRequestForm`        | Request an OTP code via email           | Multi-step verification          |
| `OTPVerifyForm`         | Verify the OTP code                     | Second step after OTPRequestForm |
| `PasswordlessLoginForm` | Unified form supporting both methods    | Prop-controlled method selection |

## Quick Implementation

### Magic Link (Simplest)

```tsx
import { MagicLinkForm } from '@/components/auth/magic-link-form'

export default function LoginPage() {
  return <MagicLinkForm />
}
```

### OTP Flow (Two Pages)

**Page 1: Request OTP**

```tsx
import { OTPRequestForm } from '@/components/auth/otp-request-form'

export default function RequestPage() {
  return <OTPRequestForm />
}
```

**Page 2: Verify OTP**

```tsx
import { OTPVerifyForm } from '@/components/auth/otp-verify-form'
import { Suspense } from 'react'

export default function VerifyPage() {
  return (
    <Suspense>
      <OTPVerifyForm />
    </Suspense>
  )
}
```

### PasswordlessLoginForm (Recommended)

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

export default function LoginPage() {
  // Magic Link (default)
  return <PasswordlessLoginForm method="magic-link" />

  // Or OTP
  // return <PasswordlessLoginForm method="otp" />
}
```

## API Reference

### signInWithOtp (Magic Link)

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,
    emailRedirectTo: 'https://yourapp.com/auth/confirm',
  },
})
```

### signInWithOtp (OTP)

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,
  },
})
```

### verifyOtp

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email',
})
```

### verifyOtp (Magic Link - Server)

```typescript
const { error } = await supabase.auth.verifyOtp({
  type: 'email',
  token_hash: 'hash_from_url',
})
```

## Configuration Checklist

- [ ] Environment variables set
- [ ] Redirect URLs configured in Supabase Dashboard
- [ ] Email template configured (Magic Link OR OTP)
- [ ] Supabase client created (client.ts and server.ts)
- [ ] Middleware added (optional)
- [ ] UI components installed (button, card, input, label)
- [ ] Auth components copied to project

## File Structure

```
your-app/
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── components/
│   └── auth/
│       ├── magic-link-form.tsx
│       ├── otp-request-form.tsx
│       ├── otp-verify-form.tsx
│       └── passwordless-login-form.tsx
├── app/
│   ├── auth/
│   │   ├── confirm/
│   │   │   └── route.ts
│   │   ├── error/
│   │   │   └── page.tsx
│   │   ├── magic-link/
│   │   │   └── page.tsx
│   │   ├── otp/
│   │   │   └── page.tsx
│   │   ├── verify-otp/
│   │   │   └── page.tsx
│   │   └── passwordless/
│   │       └── page.tsx
│   └── protected/
│       └── page.tsx
├── middleware.ts
└── .env.local
```

## Common Code Snippets

### Check if User is Authenticated

```typescript
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/login')
}
```

### Sign Out

```typescript
const supabase = await createClient()
await supabase.auth.signOut()
redirect('/auth/login')
```

### Get User Session

```typescript
const supabase = await createClient()
const {
  data: { session },
} = await supabase.auth.getSession()
```

### Listen to Auth Changes

```typescript
const supabase = createClient()

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user)
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})
```

## Email Templates

### Magic Link Template

```html
<h2>Magic Link</h2>
<p>Click here to sign in:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign In</a></p>
```

### OTP Template

```html
<h2>Your Login Code</h2>
<p>Enter this code to sign in:</p>
<h1>{{ .Token }}</h1>
<p>Expires in 1 hour</p>
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Dashboard URLs

- **Project Settings**: Settings > API
- **Auth Configuration**: Authentication > Providers
- **URL Configuration**: Authentication > URL Configuration
- **Email Templates**: Authentication > Email Templates
- **Rate Limits**: Authentication > Rate Limits
- **Auth Logs**: Authentication > Logs

## Default Settings

| Setting               | Default Value       | Configurable      |
| --------------------- | ------------------- | ----------------- |
| OTP Expiration        | 1 hour              | Yes (max 24h)     |
| Rate Limit            | 1 req/60s per email | Yes               |
| Magic Link Expiration | 1 hour              | Yes               |
| Auto Sign-Up          | Enabled             | Yes (per request) |

## Error Messages

| Error                       | Cause                   | Solution                         |
| --------------------------- | ----------------------- | -------------------------------- |
| "Email rate limit exceeded" | Too many requests       | Wait 60 seconds                  |
| "Invalid redirect URL"      | URL not whitelisted     | Add to Supabase Dashboard        |
| "Invalid token"             | Expired or used token   | Request new token                |
| "User not found"            | shouldCreateUser: false | Set to true or create user first |

## Testing Checklist

- [ ] Magic link arrives in email
- [ ] Magic link redirects correctly
- [ ] OTP code arrives in email
- [ ] OTP verification works
- [ ] Expired tokens are rejected
- [ ] Invalid tokens show error
- [ ] Rate limiting works
- [ ] Protected routes redirect
- [ ] Sign out works
- [ ] Middleware protects routes

## Performance Tips

1. Use Suspense for OTP verify page
2. Implement loading states
3. Add error boundaries
4. Use optimistic UI updates
5. Cache auth state when appropriate

## Security Best Practices

1. Always use HTTPS in production
2. Implement rate limiting
3. Monitor auth logs
4. Set appropriate token expiration
5. Validate email addresses
6. Use secure cookies
7. Enable CSRF protection

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ⚠️ IE11 (not supported)

## Dependencies

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@supabase/ssr": "^0.x.x",
  "next": "^13.x.x || ^14.x.x || ^15.x.x",
  "react": "^18.x.x"
}
```

## Useful Links

- [Full Documentation](./README.md)
- [Getting Started Guide](./GETTING_STARTED.md)
- [Usage Guide](./USAGE.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Pro Tip**: Start with `PasswordlessLoginForm` - it gives users both options and you can always switch to individual forms later!
