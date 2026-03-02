---
id: 'oauth-server-mcp'
title: 'Model Context Protocol (MCP) Authentication'
description: 'Integrate Supabase Auth with MCP servers to authenticate AI agents using your existing user base'
---

The Model Context Protocol (MCP) is an open standard for connecting AI agents and LLM tools to data sources and services. While Supabase doesn't provide MCP server functionality, you can build your own MCP servers that connect to your Supabase project and leverage Supabase Auth's OAuth 2.1 capabilities to authenticate AI agents using your existing user base.

## Why use Supabase Auth for MCP?

When building MCP servers that connect to your Supabase project, you can leverage your existing Supabase Auth infrastructure to authenticate AI agents:

- **Use your existing user base** - No need to create separate authentication systems; AI agents authenticate as your existing users
- **Standards-compliant OAuth 2.1** - Full implementation with PKCE that MCP clients expect
- **Automatic discovery** - MCP clients auto-configure using Supabase's discovery endpoints
- **Dynamic client registration** - MCP clients can register themselves automatically with your project
- **Row Level Security** - Your existing RLS policies automatically apply to MCP clients
- **User authorization** - Users explicitly approve AI agent access through your authorization flow
- **Token management** - Automatic refresh token rotation and expiration handled by Supabase

## How MCP authentication works

When you build an MCP server that connects to your Supabase project, authentication flows through Supabase Auth:

1. **Discovery**: The MCP client fetches your OAuth configuration from Supabase's discovery endpoint
2. **Registration** (optional): The client registers itself as an OAuth client in your Supabase project
3. **Authorization**: User is redirected to your authorization endpoint to approve the AI tool's access
4. **Token exchange**: Supabase issues access and refresh tokens for the authenticated user
5. **Authenticated access**: The MCP server can now make requests to your Supabase APIs on behalf of the user

By leveraging Supabase Auth, your MCP server can authenticate AI agents using your existing user accounts without building a separate authentication system.

## Prerequisites

Before setting up MCP authentication:

- [Enable OAuth 2.1 server](/docs/guides/auth/oauth-server/getting-started) in your Supabase project
- Build an [authorization endpoint](/docs/guides/auth/oauth-server/getting-started#build-your-authorization-endpoint)
- (Optional) Enable dynamic client registration

## Setting up your MCP server

Configure your MCP server to use your Supabase Auth server:

```
https://<project-ref>.supabase.co/auth/v1
```

Replace `<project-ref>` with your project reference ID from the Supabase dashboard.

MCP clients will automatically discover your OAuth configuration from:

```
https://<project-ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1
```

### OAuth client setup

Depending on your MCP server implementation, you have two options:

- **Pre-register an OAuth client** - Manually register your client by following the [Register an OAuth client](/docs/guides/auth/oauth-server/getting-started#register-an-oauth-client) guide and use the client credentials in your MCP server
- **Dynamic client registration** - Enable this in **Authentication** > **OAuth Server** in your Supabase dashboard to allow MCP clients to register themselves automatically without manual intervention

<Admonition type="caution">

Dynamic registration allows any MCP client to register with your project. Consider:

- Requiring user approval for all clients
- Monitoring registered clients regularly
- Validating redirect URIs are from trusted domains

</Admonition>

## Building an MCP server with Supabase Auth

When building your own MCP server, integrate with Supabase Auth to authenticate AI agents as your existing users and leverage your RLS policies.

<Admonition type="tip">

**Looking for an easier way to build MCP servers?**

[FastMCP](https://gofastmcp.com) provides a streamlined way to build MCP servers with built-in Supabase Auth integration. FastMCP handles OAuth configuration, token management, and authentication flows automatically, letting you focus on building your AI agent's functionality. Check out their [Supabase integration guide](https://gofastmcp.com/integrations/supabase#supabase-fastmcp) to get started quickly.

</Admonition>

## Handling MCP tokens in your application

When your MCP server makes requests to your Supabase APIs on behalf of authenticated users, it will send access tokens issued by Supabase Auth, just like any other OAuth client.

### Validating MCP tokens

Use the same token validation as other OAuth clients.

See [Token Security & RLS](/docs/guides/auth/oauth-server/token-security) for more examples.

## Security considerations

### User approval

Always require explicit user approval for MCP clients:

- Show clear information about what the AI agent can access
- Display the client name and description
- List the scopes being requested
- Provide an option to deny access
- Allow users to revoke access later

## Troubleshooting

### MCP client can't discover OAuth configuration

**Problem**: Client shows "OAuth discovery failed" or similar error.

**Solutions**:

- Verify OAuth 2.1 is enabled in your project
- Check that `/.well-known/oauth-authorization-server` returns valid JSON
- Ensure your project URL is accessible

### Dynamic registration fails

**Problem**: Client receives 403 or 404 on registration endpoint.

**Solutions**:

- Enable dynamic client registration in project settings
- Verify redirect URIs are valid, complete URLs (protocol, domain, path, and port)
- Check for rate limiting on registration endpoint

### Token exchange fails

**Problem**: Client receives "invalid_grant" error.

**Solutions**:

- Verify authorization code hasn't expired (10 minutes)
- Ensure code verifier matches code challenge
- Check that redirect URI exactly matches registration
- Confirm client_id is correct

### RLS policies block MCP access

**Problem**: MCP client can't access data despite valid token.

**Solutions**:

- Check RLS policies include the MCP client's `client_id`
- Verify user has necessary permissions
- Test with service role key to isolate RLS issues
- Review [Token Security guide](/docs/guides/auth/oauth-server/token-security)

## Next steps

- [Secure with RLS](/docs/guides/auth/oauth-server/token-security) - Create granular policies for MCP clients
- [OAuth flows](/docs/guides/auth/oauth-server/oauth-flows) - Deep dive into OAuth implementation
- [MCP Specification](https://modelcontextprotocol.io/docs) - Official MCP documentation
