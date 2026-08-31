# Supabase Auth

> Built-in authentication, authorization, and user management for every Supabase project.

Supabase Auth provides a complete user management system without any external authentication service. It is deeply integrated with Postgres Row Level Security for fine-grained access control, so you can write authorization policies in SQL rather than application code.

## Key Features

- **Social login**: 20+ providers out of the box (Google, GitHub, Apple, Azure/Microsoft, Facebook, Twitter, Discord, GitLab, and more), enabled with one click
- **Email/password**: built-in email signup with confirmation, password reset, and email change flows
- **Phone/OTP**: SMS-based authentication with one-time passwords
- **Magic links**: passwordless email authentication
- **Row Level Security**: authorization policies written in SQL, evaluated at the database level, no middleware needed
- **JWT-based sessions**: standard JSON Web Tokens, compatible with any JWT library
- **User management dashboard**: view, create, edit, and delete users from the Supabase Dashboard
- **Enterprise SSO**: SAML 2.0 support for enterprise single sign-on
- **Multi-factor authentication**: TOTP-based MFA for additional account security
- **Custom OAuth scopes**: request additional permissions when using social login providers
- **Server-side auth**: helpers for Next.js, SvelteKit, Remix, and other server frameworks
- **Auth hooks**: customize authentication flows with database functions or Edge Functions

## Technical Details

- Protocol: OAuth 2.0, OIDC, SAML 2.0
- Token format: JWT (access token + refresh token)
- Storage: user data stored in your project's Postgres database (auth schema), not with a third party
- Available in 16+ global regions

## How It Works

1. Users authenticate via social provider, email/password, phone, or magic link
2. Supabase Auth issues a JWT containing the user's ID and metadata
3. The JWT is sent with every request to your Supabase project
4. Postgres Row Level Security policies reference the JWT to determine what data the user can access
5. No middleware or application-level authorization code needed

## Links

- Documentation: https://supabase.com/docs/guides/auth
- API Reference: https://supabase.com/docs/reference/javascript/auth-signup
- Dashboard: https://supabase.com/dashboard
