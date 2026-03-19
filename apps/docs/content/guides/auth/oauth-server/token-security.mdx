---
id: 'oauth-server-token-security'
title: 'Token Security and Row Level Security'
description: 'Secure your data with Row Level Security policies for OAuth clients'
---

When you enable OAuth 2.1 in your Supabase project, third-party applications can access user data on their behalf. Row Level Security (RLS) policies are crucial for controlling exactly what data each OAuth client can access.

<Admonition type="caution">

**Scopes control OIDC data, not database access**

The OAuth scopes (`openid`, `email`, `profile`, `phone`) control what user information is included in ID tokens and returned by the UserInfo endpoint. They do **not** control access to your database tables or API endpoints.

Use RLS to define which OAuth clients can access which data, regardless of the scopes they requested.

</Admonition>

## How OAuth tokens work with RLS

OAuth access tokens issued by Supabase Auth are JWTs that include all standard Supabase claims plus OAuth-specific claims. This means your existing RLS policies continue to work, and you can add OAuth-specific logic to create granular access controls.

### Token structure

Every OAuth access token includes:

```json
{
  "sub": "user-uuid",
  "role": "authenticated",
  "aud": "authenticated",
  "user_id": "user-uuid",
  "email": "user@example.com",
  "client_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "aal": "aal1",
  "amr": [{ "method": "password", "timestamp": 1735815600 }],
  "session_id": "session-uuid",
  "iss": "https://<project-ref>.supabase.co/auth/v1",
  "iat": 1735815600,
  "exp": 1735819200
}
```

The key OAuth-specific claim is:

| Claim       | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| `client_id` | Unique identifier of the OAuth client that obtained this token |

You can use this claim in RLS policies to grant different permissions to different clients.

## Extracting OAuth claims in RLS

Use the `auth.jwt()` function to access token claims in your policies:

```sql
-- Get the client ID from the token
(auth.jwt() ->> 'client_id')

-- Check if the token is from an OAuth client
(auth.jwt() ->> 'client_id') IS NOT NULL

-- Check if the token is from a specific client
(auth.jwt() ->> 'client_id') = 'mobile-app-client-id'
```

## Common RLS patterns for OAuth

### Pattern 1: Grant specific client full access

Allow a specific OAuth client to access all user data:

```sql
CREATE POLICY "Mobile app can access user data"
ON user_data FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'mobile-app-client-id'
);
```

### Pattern 2: Grant multiple clients read-only access

Allow several OAuth clients to read data, but not modify it:

```sql
CREATE POLICY "Third-party apps can read profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IN (
    'analytics-client-id',
    'reporting-client-id',
    'dashboard-client-id'
  )
);
```

### Pattern 3: Restrict sensitive data from OAuth clients

Prevent OAuth clients from accessing sensitive data:

```sql
CREATE POLICY "OAuth clients cannot access payment info"
ON payment_methods FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IS NULL  -- Only direct user sessions
);
```

### Pattern 4: Client-specific data access

Different clients access different subsets of data:

```sql
-- Analytics client can only read aggregated data
CREATE POLICY "Analytics client reads summaries"
ON user_metrics FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'analytics-client-id'
);

-- Admin client can read and modify all data
CREATE POLICY "Admin client full access"
ON user_data FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'admin-client-id'
);
```

## Real-world examples

### Example 1: Multi-platform application

You have a web app, mobile app, and third-party integrations:

```sql
-- Web app: Full access
CREATE POLICY "Web app full access"
ON profiles FOR ALL
USING (
  auth.uid() = user_id AND
  (
    (auth.jwt() ->> 'client_id') = 'web-app-client-id'
    OR (auth.jwt() ->> 'client_id') IS NULL  -- Direct user sessions
  )
);

-- Mobile app: Read-only access to profiles
CREATE POLICY "Mobile app reads profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'mobile-app-client-id'
);

-- Third-party integration: Limited data access
CREATE POLICY "Integration reads public data"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'integration-client-id' AND
  is_public = true
);
```

## Custom access token hooks

[Custom Access Token Hooks](/docs/guides/auth/auth-hooks/custom-access-token-hook) work with OAuth tokens, allowing you to inject custom claims based on the OAuth client. This is particularly useful for customizing standard JWT claims like `audience` (`aud`) or adding client-specific metadata.

<Admonition type="note">

Custom Access Token Hooks are triggered for **all** token issuance. Use `client_id` or `authentication_method` (`oauth_provider/authorization_code` for OAuth flows) to differentiate OAuth from regular authentication.

</Admonition>

### Customizing the audience claim

A common use case is customizing the `audience` claim for different OAuth clients. This allows third-party services to validate that tokens were issued specifically for them:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { user, claims, client_id } = await req.json()

  // Customize audience based on OAuth client
  if (client_id === 'mobile-app-client-id') {
    return new Response(
      JSON.stringify({
        claims: {
          aud: 'https://api.myapp.com',
          app_version: '2.0.0',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (client_id === 'analytics-partner-id') {
    return new Response(
      JSON.stringify({
        claims: {
          aud: 'https://analytics.partner.com',
          access_level: 'read-only',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Default audience for non-OAuth flows
  return new Response(JSON.stringify({ claims: {} }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

The `audience` claim is especially important for:

- **JWT validation by third parties**: Services can verify tokens were issued for their specific API
- **Multi-tenant applications**: Different audiences for different client applications
- **Compliance**: Meeting security requirements that mandate audience validation

### Adding client-specific claims

You can also add custom claims and metadata based on the OAuth client:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { user, claims, client_id } = await req.json()

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SECRET_KEY')!)

  // Add custom claims based on OAuth client
  let customClaims = {}

  if (client_id === 'mobile-app-client-id') {
    customClaims.aud = 'https://mobile.myapp.com'
    customClaims.app_version = '2.0.0'
    customClaims.platform = 'mobile'
  } else if (client_id === 'analytics-client-id') {
    customClaims.aud = 'https://analytics.myapp.com'
    customClaims.read_only = true
    customClaims.data_retention_days = 90
  } else if (client_id?.startsWith('mcp-')) {
    // MCP AI agents
    const { data: agent } = await supabase
      .from('approved_ai_agents')
      .select('name, max_data_retention_days')
      .eq('client_id', client_id)
      .single()

    customClaims.aud = `https://mcp.myapp.com/${client_id}`
    customClaims.ai_agent = true
    customClaims.agent_name = agent?.name
    customClaims.max_retention = agent?.max_data_retention_days
  }

  return new Response(JSON.stringify({ claims: customClaims }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Use these custom claims in RLS:

```sql
-- Policy based on custom claims
CREATE POLICY "Read-only clients cannot modify"
ON user_data FOR UPDATE
USING (
  auth.uid() = user_id AND
  (auth.jwt() -> 'user_metadata' ->> 'read_only')::boolean IS NOT TRUE
);

-- Policy based on audience claim
CREATE POLICY "Only specific audience can access"
ON api_data FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'aud') IN (
    'https://api.myapp.com',
    'https://mobile.myapp.com'
  )
);
```

## Security best practices

### 1. Principle of least privilege

Grant OAuth clients only the minimum permissions they need:

```sql
-- Bad: Grant all access by default
CREATE POLICY "OAuth clients full access"
ON user_data FOR ALL
USING (auth.uid() = user_id);

-- Good: Grant specific access per client
CREATE POLICY "Specific client specific access"
ON user_data FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') = 'trusted-client-id'
);
```

### 2. Separate policies for OAuth clients

Create dedicated policies for OAuth clients rather than mixing them with user policies:

```sql
-- User access
CREATE POLICY "Users access their own data"
ON user_data FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IS NULL
);

-- OAuth client access (separate policy)
CREATE POLICY "OAuth clients limited access"
ON user_data FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IN ('client-1', 'client-2')
);
```

### 3. Regularly audit OAuth clients

Track and review which clients have access:

```sql
-- View all active OAuth clients
SELECT
  oc.client_id,
  oc.name,
  oc.created_at,
  COUNT(DISTINCT s.user_id) as active_users
FROM auth.oauth_clients oc
LEFT JOIN auth.sessions s ON s.client_id = oc.client_id
WHERE s.created_at > NOW() - INTERVAL '30 days'
GROUP BY oc.client_id, oc.name, oc.created_at;
```

## Testing your policies

Always test your RLS policies before deploying to production:

```sql
-- Test as a specific OAuth client
SET request.jwt.claims = '{
  "sub": "test-user-uuid",
  "role": "authenticated",
  "client_id": "test-client-id"
}';

-- Test queries
SELECT * FROM user_data WHERE user_id = 'test-user-uuid';

-- Reset
RESET request.jwt.claims;
```

Or use the Supabase Dashboard's [RLS policy tester](/dashboard/project/_/auth/policies).

## Troubleshooting

### Policy not working for OAuth client

**Problem**: OAuth client can't access data despite having a valid token.

**Check**:

1. Verify the policy includes the client's `client_id`
2. Ensure RLS is enabled on the table
3. Check for conflicting restrictive policies
4. Test with service role key to isolate RLS issues

```sql
-- Debug: See what client_id is in the token
SELECT auth.jwt() ->> 'client_id';

-- Debug: Test without RLS
SET LOCAL role = service_role;
SELECT * FROM your_table;
```

### Policy too permissive

**Problem**: OAuth client has access to data it shouldn't.

**Solution**: Use `AS RESTRICTIVE` policies to add additional constraints:

```sql
-- This policy runs in addition to permissive policies
CREATE POLICY "Restrict OAuth clients"
ON sensitive_data
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  -- OAuth clients cannot access this table at all
  (auth.jwt() ->> 'client_id') IS NULL
);
```

### Can't differentiate between users and OAuth clients

**Problem**: Need to apply different logic for direct user sessions vs OAuth.

**Solution**: Check if `client_id` is present:

```sql
-- Direct user sessions (no OAuth)
CREATE POLICY "Direct users full access"
ON user_data FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IS NULL
);

-- OAuth clients (limited access)
CREATE POLICY "OAuth clients read only"
ON user_data FOR SELECT
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IS NOT NULL
);
```

## Next steps

- [Learn about JWTs](/docs/guides/auth/jwts) - Deep dive into Supabase token structure
- [Row Level Security](/docs/guides/auth/row-level-security) - Complete RLS guide
- [Custom Access Token Hooks](/docs/guides/auth/auth-hooks/custom-access-token-hook) - Inject custom claims
- [OAuth flows](/docs/guides/auth/oauth-server/oauth-flows) - Understand token issuance
