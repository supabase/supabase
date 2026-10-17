import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createSupabaseMcpServer, SupabasePlatform } from '@supabase/mcp-server-supabase'
import { createClient } from '@supabase/supabase-js'
import { stripIndent } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import {
  commaSeparatedStringIntoArray,
  fromNodeHeaders,
  zBooleanString,
} from '@/lib/api/apiHelpers'
import {
  getDatabaseOperations,
  getDebuggingOperations,
  getDevelopmentOperations,
} from '@/lib/api/self-hosted/mcp'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:8000',
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const supportedFeatureGroupSchema = z.enum(['docs', 'database', 'development', 'debugging'])
const mcpOAuthEnabled = process.env.ENABLED_FEATURES_MCP_OAUTH === 'true'
const mcpResourceUrl =
  process.env.SUPABASE_PUBLIC_URL! + '/.well-known/oauth-protected-resource/mcp'

const mcpAllowedUsers = process.env.MCP_ALLOWED_USERS?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

if (mcpOAuthEnabled && (!mcpAllowedUsers || mcpAllowedUsers.length === 0)) {
  throw new Error(
    'MCP OAuth is enabled, but MCP_ALLOWED_USERS is not configured. Set it to a comma-separated list of allowed user email addresses.'
  )
}

const mcpQuerySchema = z.object({
  features: z
    .string()
    .transform(commaSeparatedStringIntoArray)
    .optional()
    .describe(
      stripIndent`
        A comma-separated list of feature groups to filter tools by. If not provided, all tools are available.

        The following feature groups are supported: ${supportedFeatureGroupSchema.options.map((group) => `\`${group}\``).join(', ')}.
      `
    )
    .pipe(z.array(supportedFeatureGroupSchema).optional()),
  read_only: zBooleanString()
    .default('false')
    .describe(
      'Indicates whether or not the MCP server should operate in read-only mode. This prevents write operations on any of your databases by executing SQL as a read-only Postgres user.'
    ),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }
}

const getClaims = async (token?: string) => {
  if (!token) return { data: null, error: new Error('invalid token') }
  try {
    return await supabase.auth.getClaims(token)
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  if (mcpOAuthEnabled) {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const { data, error } = await getClaims(token)

    if (error || !data) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer error="invalid_token", error_description="The access token provided is invalid", resource_metadata="${mcpResourceUrl}"`
      )

      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { email, aud } = data.claims
    const isValidAud = Array.isArray(aud) ? aud.includes('authenticated') : aud === 'authenticated'

    if (!isValidAud || !email || !mcpAllowedUsers!.includes(email.toLowerCase())) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }
  const { error, data } = mcpQuerySchema.safeParse(req.query)

  if (error) {
    return res.status(400).json({ error: error.flatten().fieldErrors })
  }

  const { features, read_only } = data
  const headers = fromNodeHeaders(req.headers)

  const platform: SupabasePlatform = {
    database: getDatabaseOperations({ headers }),
    development: getDevelopmentOperations({ headers }),
    debugging: getDebuggingOperations({ headers }),
  }

  try {
    const server = createSupabaseMcpServer({
      platform,
      projectId: DEFAULT_PROJECT.ref,
      features,
      readOnly: read_only,
    })

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless, don't use session management
      enableJsonResponse: true, // Stateless, discourage SSE streams
    })

    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    // Errors at this point will be due MCP setup issues
    // Future errors will be handled at the JSON-RPC level within the MCP protocol
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(500).json({ error: 'Unable to process MCP request', cause: error })
  }
}

export default handler
