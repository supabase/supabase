# Passwordless Authentication - Complete Documentation Index

## Overview

This is a complete passwordless authentication solution for Next.js applications using Supabase Auth. It supports both Magic Link and OTP (One-Time Password) authentication methods.

## Documentation Files

### 📚 Getting Started

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Step-by-step setup guide (10 minutes)
  - Installation instructions
  - Configuration steps
  - Your first login page
  - Troubleshooting

### 📖 Main Documentation

- **[README.md](./README.md)** - Complete feature documentation
  - Features overview
  - Components reference
  - Setup instructions
  - Configuration options
  - Security considerations

### 🎯 Quick Reference

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick lookup guide
  - Component comparison table
  - API reference
  - Configuration checklist
  - Common code snippets
  - Error messages reference

### 📘 Usage Guide

- **[USAGE.md](./USAGE.md)** - Detailed usage instructions
  - Authentication methods comparison
  - Component API
  - Advanced configuration
  - Best practices
  - Migration guides

### 🔧 Integration Examples

- **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Real-world implementations
  - E-commerce application
  - SaaS dashboard
  - Blog platform
  - Multi-tenant application
  - Progressive Web App

## Components

### Core Components

#### 1. PasswordlessLoginForm (Recommended)

A unified form supporting both Magic Link and OTP authentication via the `method` prop.

**File**: `components/passwordless-login-form.tsx`

**Use when**: You want a single form that can handle either authentication method.

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

// Magic Link (default)
<PasswordlessLoginForm method="magic-link" />

// OTP
<PasswordlessLoginForm method="otp" />
```

#### 2. MagicLinkForm

Standalone Magic Link authentication form.

**File**: `components/magic-link-form.tsx`

**Use when**: You only want to offer Magic Link authentication.

```tsx
import { MagicLinkForm } from '@/components/auth/magic-link-form'
```

#### 3. OTPRequestForm

Request a one-time password via email.

**File**: `components/otp-request-form.tsx`

**Use when**: First step of OTP flow, or standalone OTP-only auth.

```tsx
import { OTPRequestForm } from '@/components/auth/otp-request-form'
```

#### 4. OTPVerifyForm

Verify the OTP code received via email.

**File**: `components/otp-verify-form.tsx`

**Use when**: Second step of OTP flow for code verification.

```tsx
import { OTPVerifyForm } from '@/components/auth/otp-verify-form'
```

## Pages

### Authentication Pages

- `app/auth/passwordless/page.tsx` - Combined login form
- `app/auth/magic-link/page.tsx` - Magic Link only
- `app/auth/otp/page.tsx` - OTP request
- `app/auth/verify-otp/page.tsx` - OTP verification
- `app/auth/error/page.tsx` - Error handling
- `app/auth/confirm/route.ts` - Magic Link confirmation handler

### Example Pages

- `app/protected/page.tsx` - Example protected page

## Key Features

✅ **Magic Link Authentication**

- One-click email authentication
- Automatic session creation
- Configurable redirect URLs

✅ **OTP Authentication**

- 6-digit code verification
- Resend functionality
- Auto-format input

✅ **Unified Form**

- Prop-based method selection
- Single integration point
- Consistent UI/UX

✅ **Security**

- Rate limiting
- Token expiration
- HTTPS enforcement
- Secure session management

✅ **User Experience**

- Clear error messages
- Loading states
- Success confirmations
- Responsive design

✅ **TypeScript**

- Full type safety
- IntelliSense support
- Type definitions included

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Set Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configure Supabase

- Add redirect URLs in Dashboard
- Configure email template
- Enable email authentication

### 4. Add Component

```tsx
import { PasswordlessLoginForm } from '@/components/auth/passwordless-login-form'

export default function LoginPage() {
  return <PasswordlessLoginForm method="magic-link" />
}
```

## File Structure

```
passwordless-auth-nextjs/
├── components/
│   ├── magic-link-form.tsx
│   ├── otp-request-form.tsx
│   ├── otp-verify-form.tsx
│   └── passwordless-login-form.tsx
├── app/
│   ├── auth/
│   │   ├── confirm/route.ts
│   │   ├── error/page.tsx
│   │   ├── magic-link/page.tsx
│   │   ├── otp/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── passwordless/page.tsx
│   └── protected/page.tsx
├── middleware.ts
├── registry-item.json
├── README.md
├── GETTING_STARTED.md
├── QUICK_REFERENCE.md
├── USAGE.md
├── INTEGRATION_EXAMPLES.md
└── INDEX.md (this file)
```

## Component Decision Tree

```
Do you need passwordless auth?
│
├─ Yes → Do you want to offer both methods?
│   │
│   ├─ Yes → Use PasswordlessLoginForm
│   │
│   └─ No → Which method?
│       │
│       ├─ Magic Link → Use MagicLinkForm
│       │
│       └─ OTP → Use OTPRequestForm + OTPVerifyForm
│
└─ No → Consider password-based auth instead
```

## Common Use Cases

| Use Case      | Recommended Component              | Documentation           |
| ------------- | ---------------------------------- | ----------------------- |
| Simple login  | `PasswordlessLoginForm`            | GETTING_STARTED.md      |
| E-commerce    | `MagicLinkForm`                    | INTEGRATION_EXAMPLES.md |
| Mobile app    | `OTPRequestForm` + `OTPVerifyForm` | USAGE.md                |
| SaaS platform | `PasswordlessLoginForm`            | INTEGRATION_EXAMPLES.md |
| Blog comments | `MagicLinkForm`                    | INTEGRATION_EXAMPLES.md |
| Admin panel   | `OTPRequestForm` + `OTPVerifyForm` | USAGE.md                |

## Configuration Matrix

| Feature                | MagicLinkForm | OTPRequestForm + OTPVerifyForm | PasswordlessLoginForm           |
| ---------------------- | ------------- | ------------------------------ | ------------------------------- |
| One-click login        | ✅            | ❌                             | ✅ (with `method="magic-link"`) |
| Code entry             | ❌            | ✅                             | ✅ (with `method="otp"`)        |
| Method selection       | Fixed         | Fixed                          | Via prop                        |
| Email template changes | Optional      | Required                       | Depends on method               |
| Pages needed           | 1             | 2                              | 1                               |
| Complexity             | Low           | Medium                         | Low                             |

## Support

### Documentation

- Start with **GETTING_STARTED.md** for setup
- Use **QUICK_REFERENCE.md** for quick lookups
- Read **USAGE.md** for detailed usage
- Check **INTEGRATION_EXAMPLES.md** for real-world patterns

### External Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Discord](https://discord.supabase.com)

### Troubleshooting

See the Troubleshooting sections in:

- GETTING_STARTED.md (setup issues)
- USAGE.md (usage issues)
- QUICK_REFERENCE.md (error messages)

## Version Compatibility

| Package               | Version          |
| --------------------- | ---------------- |
| Next.js               | 13.x, 14.x, 15.x |
| React                 | 18.x             |
| @supabase/supabase-js | 2.x              |
| @supabase/ssr         | 0.x              |

## License

This component block is part of the Supabase UI Library and follows the same license as the parent project.

---

**Need help?** Start with [GETTING_STARTED.md](./GETTING_STARTED.md) for a 10-minute setup guide.

**Have questions?** Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for quick answers.

**Ready to implement?** Read [USAGE.md](./USAGE.md) for detailed instructions.

**Looking for examples?** See [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for real-world patterns.
