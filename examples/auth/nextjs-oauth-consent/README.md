# OAuth Consent Page for MCP Authentication

A Next.js consent page example for OAuth 2.1 authorization flows with Supabase Auth. This page handles user authentication and authorization approval for MCP (Model Context Protocol) servers.

## Features

- OAuth 2.1 consent flow with Supabase Auth
- Automatic redirect to OAuth provider if not logged in
- Display of requested scopes and client information
- User approval/denial handling

## Setup

### Prerequisites

- A Supabase project with OAuth 2.1 enabled
- An OAuth provider configured (e.g., Google)
- Node.js 18+

### Installation

1. Clone this example and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

3. Update the environment variables with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

The consent page will be available at `http://localhost:3000/oauth/consent`.

### Deployment

Deploy to your preferred hosting platform (Vercel, Netlify, Render, etc.).

After deployment, configure your consent page URL in the Supabase dashboard:

1. Go to **Authentication** > **OAuth Server**
2. Set the **Authorization URL** to your deployed consent page URL (e.g., `https://your-domain.com/oauth/consent`)

## How It Works

1. When an MCP client initiates an OAuth flow, Supabase redirects the user to your consent page with an `authorization_id` parameter.

2. The consent page checks if the user is logged in:
   - If not logged in, it redirects to the configured OAuth provider (Google in this example)
   - After authentication, the user is redirected back to the consent page

3. The page fetches authorization details using `supabase.auth.oauth.getAuthorizationDetails(authorizationId)` to display:
   - Client name
   - Requested scopes

4. When the user clicks "Allow" or "Deny":
   - `supabase.auth.oauth.approveAuthorization(authorizationId)` or
   - `supabase.auth.oauth.denyAuthorization(authorizationId)`

5. Supabase handles the redirect back to the MCP client with the authorization code (or error).

## Customization

### Using a Different OAuth Provider

Update the `signInWithOAuth` call in `src/app/oauth/consent/page.tsx`:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github', // or any other supported provider
  options: {
    redirectTo: currentUrl,
  },
})
```

### Styling

This example uses Tailwind CSS. Customize the styles in:
- `src/app/globals.css` - Global styles
- `src/app/oauth/consent/page.tsx` - Component styles

## Resources

- [Supabase OAuth 2.1 Server Documentation](https://supabase.com/docs/guides/auth/oauth-server)
- [MCP Authentication Guide](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
