/** @jsxRuntime automatic */
/** @jsxImportSource mdast-jsx */

import {
  HOSTED_MCP_URL as HOSTED_URL,
  DEFAULT_MCP_URL_NON_PLATFORM as LOCAL_URL,
  MCP_CLIENT_DATA,
  MCP_CLIENT_GROUPS,
  MCP_CLIENT_INSTRUCTIONS,
} from './clients.data'
import type { McpBlock, McpClientData, McpInline } from './clients.data'
import { buildClientConfig } from './utils/getMcpUrl'
import { serializeMcpConfig } from './utils/serializeMcpConfig'

// Flatten the `as const` group tuples into the union of client keys.
type McpClientKey = (typeof MCP_CLIENT_GROUPS)[number]['keys'][number]

// The docs document the hosted platform, so instructions render their hosted variant.
const IS_PLATFORM = true

/** Renders inline spans (plain text, inline code, bold, links) as mdast. */
function Inline({ parts }: { parts: McpInline[] }) {
  return (
    <>
      {parts.map((part) => {
        if (typeof part === 'string') return part
        if ('code' in part) return <inlineCode value={part.code} />
        if ('strong' in part) return <strong>{part.strong}</strong>
        return <link url={part.href}>{part.link}</link>
      })}
    </>
  )
}

/**
 * Renders portable instruction blocks (see `clients.data.ts`) as markdown.
 * The dashboard renders the same blocks via its own React adapter. Image blocks
 * are dropped here - they're illustrative screenshots and the surrounding text
 * already conveys the steps.
 */
function Blocks({ blocks }: { blocks: McpBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            return (
              <paragraph>
                <Inline parts={block.content} />
              </paragraph>
            )
          case 'callout':
            return (
              <paragraph>
                <Inline
                  parts={[block.variant === 'warning' ? 'Warning: ' : 'Note: ', ...block.content]}
                />
              </paragraph>
            )
          case 'command':
            return (
              <code
                lang="bash"
                value={typeof block.value === 'function' ? block.value(HOSTED_URL) : block.value}
              />
            )
          case 'image':
            return null
        }
      })}
    </>
  )
}

/** One client's section: a bold lead-in, then its install/config/connector steps and auth. */
function Client({ client }: { client: McpClientData }) {
  const instructions = MCP_CLIENT_INSTRUCTIONS[client.key]
  const config = client.configFile
    ? {
        file: client.configFile,
        ...serializeMcpConfig(client.configFile, buildClientConfig(HOSTED_URL, client)),
      }
    : null

  return (
    <>
      <paragraph>
        <strong>{client.label}</strong>
      </paragraph>

      {instructions?.deepLinkDescription && (
        <paragraph>
          <Inline parts={instructions.deepLinkDescription} />
        </paragraph>
      )}

      {instructions?.primary && (
        <Blocks blocks={instructions.primary({ isPlatform: IS_PLATFORM })} />
      )}

      {config ? (
        <>
          <paragraph>
            {instructions?.primary ? 'Alternatively, add' : 'Add'} this configuration to{' '}
            <inlineCode value={config.file} />:
          </paragraph>
          <code lang={config.lang} value={config.value} />
        </>
      ) : !instructions?.primary && client.externalDocsUrl ? (
        <paragraph>
          Available as a connector. Install it from the{' '}
          <link url={client.externalDocsUrl}>{client.label} directory</link>.
        </paragraph>
      ) : null}

      {instructions?.alternate && (
        <Blocks blocks={instructions.alternate({ isPlatform: IS_PLATFORM })} />
      )}
    </>
  )
}

/**
 * Static markdown rendering of `<McpConfigPanel />` for the docs `.md` build.
 * Co-located with the React component and built from the same shared data, so
 * the markdown and the dashboard's Connect panel can't drift. Authored with the
 * mdast-jsx runtime; consumed by the docs markdown pipeline.
 */
export function McpConfigPanel() {
  const clientsByKey = new Map(MCP_CLIENT_DATA.map((c) => [c.key, c]))

  return (
    <>
      <paragraph>
        The hosted Supabase MCP server is available at <inlineCode value={HOSTED_URL} />. If
        you&apos;re developing locally with the Supabase CLI, use <inlineCode value={LOCAL_URL} />{' '}
        instead.
      </paragraph>
      <paragraph>
        Find your client below and add the configuration shown. You can scope the server by
        appending URL query parameters: <inlineCode value="?project_ref=<id>" /> to limit it to a
        single project, <inlineCode value="?read_only=true" /> to allow only read queries, and{' '}
        <inlineCode value="?features=database,docs" /> to enable specific tool groups.
      </paragraph>

      {MCP_CLIENT_GROUPS.map((group) => (
        <>
          <heading depth={4}>{group.heading}</heading>
          {group.keys.map((key: McpClientKey) => {
            const client = clientsByKey.get(key)
            return client ? <Client client={client} /> : null
          })}
        </>
      ))}

      <paragraph>
        <strong>Authentication</strong>
      </paragraph>
      <paragraph>
        Some MCP clients automatically prompt you to log in during setup, while others require
        manual authentication steps. Either way, a browser window opens where you log in to your
        Supabase account and grant the MCP client access to your organization.
      </paragraph>
      <paragraph>
        A personal access token (PAT) was previously required, but is no longer needed.
      </paragraph>
    </>
  )
}
