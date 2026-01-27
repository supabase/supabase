# Passwordless Authentication - Usage Guide

This guide provides detailed instructions for implementing passwordless authentication in your Next.js application using Supabase Auth.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Methods](#authentication-methods)
3. [Component API](#component-api)
4. [Advanced Configuration](#advanced-configuration)
5. [Best Practices](#best-practices)

## Quick Start

### Installation

1. Copy the block to your project:

```bash
npx shadcn@latest add passwordless-auth-nextjs
```

2. Set up environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Configure Supabase redirect URLs in your dashboard:
   - `http://localhost:3000/auth/confirm` (development)
   - `https://yourdomain.com/auth/confirm` (production)

### Basic Implementation

```tsx
import { PasswordlessLoginForm } from '@/components/passwordless-login-form'

export default function LoginPage() {
  return <PasswordlessLoginForm />
}
```

## Authentication Methods

### 1. Magic Link

Magic Links are one-time use URLs sent to the user's email. When clicked, they automatically authenticate the user.

**Advantages:**

- Seamless user experience (one click to login)
- No need to remember or type codes
- Works across devices

**Disadvantages:**

- Requires user to access their email
- May be caught by spam filters
- Links expire after 1 hour

**Implementation:**

```tsx
import { MagicLinkForm } from '@/components/magic-link-form'

export default function MagicLinkLoginPage() {
  return (
    <div className="container mx-auto max-w-md py-10">
      <MagicLinkForm />
    </div>
  )
}
```

**Email Template Configuration:**

For implicit flow (default):

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

For PKCE flow:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

### 2. OTP (One-Time Password)

OTPs are 6-digit codes sent to the user's email that they manually enter.

**Advantages:**

- More control (user types the code)
- Works better for mobile apps
- Familiar to users

**Disadvantages:**

- Extra step (user must type code)
- Possible typos
- Codes expire after 1 hour

**Implementation:**

```tsx
// Step 1: Request OTP
import { OTPRequestForm } from '@/components/otp-request-form'

export default function RequestOTPPage() {
  return (
    <div className="container mx-auto max-w-md py-10">
      <OTPRequestForm />
    </div>
  )
}

// Step 2: Verify OTP
import { OTPVerifyForm } from '@/components/otp-verify-form'
import { Suspense } from 'react'

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto max-w-md py-10">
        <OTPVerifyForm />
      </div>
    </Suspense>
  )
}
```

**Email Template Configuration:**

```html
<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
<p>This code will expire in 1 hour.</p>
```

### 3. PasswordlessLoginForm (Recommended)

A unified authentication form that supports both Magic Link and OTP. Use the `method` prop to specify which authentication method to use.

```tsx
import { PasswordlessLoginForm } from '@/components/passwordless-login-form'

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-md py-10">
      <PasswordlessLoginForm method="magic-link" />
    </div>
  )
}
```

**With OTP:**

```tsx
<PasswordlessLoginForm method="otp" />
```

## Component API

### MagicLinkForm

**Props:**

```typescript
interface MagicLinkFormProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string
}
```

**Events:**

- On success: Displays confirmation message
- On error: Shows error message inline

**Example with custom styling:**

```tsx
<MagicLinkForm className="rounded-xl shadow-2xl" />
```

### OTPRequestForm

**Props:**

```typescript
interface OTPRequestFormProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string
}
```

**Behavior:**

- On success: Redirects to `/auth/verify-otp?email={email}`
- On error: Shows error message inline

### OTPVerifyForm

**Props:**

```typescript
interface OTPVerifyFormProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string
}
```

**Features:**

- Auto-formats OTP input (numbers only, max 6 digits)
- Resend functionality
- Email display from query parameter

**Example:**

```tsx
// The email is passed via query parameter
// URL: /auth/verify-otp?email=user@example.com
<OTPVerifyForm />
```

### PasswordlessLoginForm

**Props:**

```typescript
interface PasswordlessLoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  method?: 'magic-link' | 'otp'
  className?: string
}
```

**Features:**

- Single form supporting both Magic Link and OTP
- Method controlled via prop (defaults to `'magic-link'`)
- Success state management
- Automatic redirect for OTP verification

## Advanced Configuration

### Custom Redirect URLs

Customize where users are redirected after authentication:

```typescript
// In your component
const handleLogin = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })
}
```

### Disable Auto Sign-Up

Prevent new user creation, only allow existing users:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
  },
})
```

### Custom OTP Expiration

Configure in Supabase Dashboard:

1. Go to **Authentication** > **Providers** > **Email**
2. Find **Email OTP Expiration**
3. Set custom duration (max 24 hours)

### Rate Limiting

Customize rate limiting in Supabase Dashboard:

1. Go to **Authentication** > **Rate Limits**
2. Adjust the rate limits for email authentication

Default: 1 request per 60 seconds per email address

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
try {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw error
  // Success handling
} catch (error) {
  // Show user-friendly error message
  if (error.message.includes('rate limit')) {
    setError('Please wait a moment before requesting another code')
  } else {
    setError('An error occurred. Please try again.')
  }
}
```

### 2. Loading States

Show loading indicators during API calls:

```tsx
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    // API call
  } finally {
    setIsLoading(false)
  }
}

return <Button disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Link'}</Button>
```

### 3. Security

- Always use HTTPS in production
- Never expose API keys in client-side code
- Implement rate limiting
- Monitor authentication logs
- Set appropriate token expiration times

### 4. User Experience

**For Magic Links:**

- Clear instructions: "Check your email for a magic link"
- Mention spam folder
- Option to resend

**For OTPs:**

- Auto-focus OTP input field
- Auto-submit when 6 digits entered
- Clear visual feedback
- Resend option with countdown

### 5. Email Templates

Make your emails clear and branded:

```html
<table style="width: 100%; max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 40px;">
      <img src="your-logo.png" alt="Logo" style="height: 40px;" />
      <h1 style="color: #333; margin-top: 30px;">Your Login Code</h1>
      <p style="font-size: 16px; color: #666;">Enter this code to sign in to your account:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;"> {{ .Token }} </span>
      </div>
      <p style="font-size: 14px; color: #999;">
        This code will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </td>
  </tr>
</table>
```

### 6. Testing

Test various scenarios:

- Valid email addresses
- Invalid email addresses
- Expired tokens/OTPs
- Multiple rapid requests (rate limiting)
- Different browsers and devices
- Email delivery times
- Spam folder handling

### 7. Analytics

Track key metrics:

- Magic Link vs OTP usage
- Success/failure rates
- Time to complete authentication
- Drop-off points in the flow

## Troubleshooting

### Problem: Magic Link not working

**Solutions:**

1. Verify redirect URLs in Supabase Dashboard
2. Check email template configuration
3. Ensure HTTPS in production
4. Check browser console for errors

### Problem: OTP not received

**Solutions:**

1. Check email provider settings in Supabase
2. Verify email template shows `{{ .Token }}`
3. Check spam folder
4. Verify rate limiting hasn't been triggered

### Problem: "Invalid token" error

**Solutions:**

1. Check if token has expired (default: 1 hour)
2. Ensure user hasn't already used the token
3. Verify system clock is synchronized
4. Check for typos in OTP entry

### Problem: Redirect not working

**Solutions:**

1. Verify `emailRedirectTo` URL is whitelisted
2. Check middleware configuration
3. Ensure URL is absolute, not relative
4. Verify Next.js routing configuration

## Migration Guide

### From Password-Based Auth

Replace password fields with email-only:

```diff
- import { LoginForm } from '@/components/login-form'
+ import { PasswordlessLoginForm } from '@/components/passwordless-login-form'

export default function LoginPage() {
-  return <LoginForm />
+  return <PasswordlessLoginForm />
}
```

### From Other Passwordless Solutions

1. Replace API calls with Supabase methods
2. Update email templates
3. Configure redirect URLs
4. Test thoroughly

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Email Template Best Practices](https://supabase.com/docs/guides/auth/auth-email-templates)
