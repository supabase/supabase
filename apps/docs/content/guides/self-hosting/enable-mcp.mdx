---
title: 'Enabling MCP Server Access'
description: 'Configure secure access to the MCP server in your self-hosted Supabase instance.'
subtitle: 'Configure secure access to the MCP server in your self-hosted Supabase instance.'
---

The MCP (Model Context Protocol) server in [self-hosted Supabase](/docs/guides/self-hosting/docker) runs behind the internal API. Currently, it does not offer OAuth 2.1 authentication, and is not intended to be exposed to the Internet. The corresponding API route has to be protected by restricting network connections from the outside. By default, all connections to the MCP server are denied.

This guide explains how to securely enable access to your self-hosted MCP server.

## Security considerations

<Admonition type="caution">

Do not allow connections to the self-hosted MCP server from the Internet. Only access it via:

- A VPN connection to the server running the Studio container
- An SSH tunnel from your local machine

</Admonition>

## Accessing via SSH tunnel

### Step 1: Determine the local IP address that will be used to access the MCP server

When connecting via an SSH tunnel to the Studio Docker container, the source IP will be that of the Docker bridge gateway. You need to allow connections from this IP address.

Determine the Docker bridge gateway IP on the host running your Supabase containers:

```bash
docker inspect supabase-kong \
  --format '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}'
```

This command will output an IP address, e.g., `172.18.0.1`.

### Step 2: Allow connections from the gateway IP

Add the IP address you discovered to the Kong configuration by editing the following section in `./volumes/api/kong.yml`:

1. Comment out the request-termination section
2. Remove the # symbols from the entire section starting with `- name: cors`, including `deny: []`
3. Add your local IP to the 'allow' list.
4. Your edited configuration should look like the example below.

```yaml
## MCP endpoint - local access
- name: mcp
  _comment: 'MCP: /mcp -> http://studio:3000/api/mcp (local access)'
  url: http://studio:3000/api/mcp
  routes:
    - name: mcp
      strip_path: true
      paths:
        - /mcp
  plugins:
    # Block access to /mcp by default
    #- name: request-termination
    #  config:
    #    status_code: 403
    #    message: "Access is forbidden."
    # Enable local access (danger zone!)
    # 1. Comment out the 'request-termination' section above
    # 2. Uncomment the entire section below, including 'deny'
    # 3. Add your local IPs to the 'allow' list
    - name: cors
    - name: ip-restriction
      config:
        allow:
          - 127.0.0.1
          - ::1
          # Add your Docker bridge gateway IP below
          - 172.18.0.1
        # Do not remove deny!
        deny: []
```

### Step 3: Restart API gateway

After you've added the local IP address as above, restart the Kong container:

```bash
docker compose restart kong
```

### Step 4: Create the SSH tunnel

From your local machine, create an SSH tunnel to your Supabase host:

```bash
ssh -L localhost:8080:localhost:8000 you@your-supabase-host
```

This command forwards local port `8080` to port `8000` on your Supabase host.

### Step 5: Configure your MCP client

Edit the settings for your MCP client and add the following to `"mcpServers": {}` or `"servers": {}`:

```json
{
  "mcpServers": {
    "supabase-self-hosted": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### Step 6: Start using the self-hosted MCP server

From your local machine, check that the MCP server is reachable:

```bash
curl http://localhost:8080/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {
        "elicitation": {}
      },
      "clientInfo": {
        "name": "test-client",
        "title": "Test Client",
        "version": "1.0.0"
      }
    }
  }'
```

Start your MCP client (Claude Code, Cursor, etc.) and verify access to the MCP tools. For example, you can ask: "What is Supabase anon key? Use the Supabase MCP server tools."

## Troubleshooting

If you are unable to connect to the MCP server:

1. Update Kong configuration file to the [latest version](https://github.com/supabase/supabase/blob/master/docker/volumes/api/kong.yml) and edit carefully
2. Confirm the Docker bridge gateway IP is correctly added in `./volumes/api/kong.yml`
3. Check Kong's logs for errors: `docker compose logs kong`
4. Make sure your SSH tunnel is active
