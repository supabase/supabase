import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createSupabaseMcpServer, SupabasePlatform } from '@supabase/mcp-server-supabase'
import { stripIndent } from 'common-tags'
import { commaSeparatedStringIntoArray, fromNodeHeaders, zBooleanString } from 'lib/api/apiHelpers'
import { getDatabaseOperations, getDevelopmentOperations } from 'lib/api/self-hosted/mcp'
import { DEFAULT_PROJECT } from 'lib/constants/api'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const supportedFeatureGroupSchema = z.enum(['docs', 'database', 'development'])

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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { error, data } = mcpQuerySchema.safeParse(req.query)

  if (error) {
    return res.status(400).json({ error: error.flatten().fieldErrors })
  }

  const { features, read_only } = data
  const headers = fromNodeHeaders(req.headers)

  const platform: SupabasePlatform = {
    database: getDatabaseOperations({ headers }),
    development: getDevelopmentOperations({ headers }),
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
