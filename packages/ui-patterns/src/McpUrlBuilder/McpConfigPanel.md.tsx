/** @jsxRuntime automatic */
/** @jsxImportSource mdast-jsx */
import type { Blockquote, Content, Paragraph } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

import {
  HOSTED_MCP_URL as HOSTED_URL,
  DEFAULT_MCP_URL_NON_PLATFORM as LOCAL_URL,
  MCP_CLIENT_DATA,
  MCP_CLIENT_GROUPS,
} from './clients.data'
import type { McpClientData } from './clients.data'
import {
  calloutVariant,
  MCP_CLIENT_INSTRUCTIONS,
  type McpCalloutVariant,
  type McpInstructionContent,
} from './clients.instructions.md'
import { buildClientConfig } from './utils/getMcpUrl'
import { serializeMcpConfig } from './utils/serializeMcpConfig'

// Flatten the `as const` group tuples into the union of client keys.
type McpClientKey = (typeof MCP_CLIENT_GROUPS)[number]['keys'][number]

// The docs document the hosted platform, so instructions render their hosted variant.
const IS_PLATFORM = true

const CALLOUT_LABELS: Record<McpCalloutVariant, string> = { warning: 'Warning', note: 'Note' }

/** Prefixes a callout blockquote's first paragraph with a bold `Warning:`/`Note:` label. */
function labelCallout(block: Blockquote, variant: McpCalloutVariant): Blockquote {
  const [first, ...rest] = block.children
  if (!first || first.type !== 'paragraph') return block
  const labeled: Paragraph = {
    ...first,
    children: [
      { type: 'strong', children: [{ type: 'text', value: `${CALLOUT_LABELS[variant]}:` }] },
      { type: 'text', value: ' ' },
      ...first.children,
    ],
  }
  return { ...block, children: [labeled, ...rest] }
}

/**
 * Adapts a shared instruction tree (see `clients.instructions.md.tsx`) for markdown:
 * drops illustrative `image` nodes (the dashboard renders these from a bundled
 * local asset; markdown has no published URL to reference, and the prose covers
 * the steps) and gives callouts a textual `Warning:`/`Note:` label, since
 * markdown has no styling to lean on.
 */
function instructionToMarkdown(tree: McpInstructionContent): Content[] {
  const blocks = tree.type === 'root' ? (tree.children as Content[]) : [tree as Content]
  const out: Content[] = []
  for (const block of blocks) {
    if (block.type === 'image') continue
    if (block.type === 'blockquote') {
      const variant = calloutVariant(block.data)
      if (variant) {
        out.push(labelCallout(block, variant))
        continue
      }
    }
    out.push(block)
  }
  return out
}

/** One client's section: a bold lead-in, then its install/config/connector steps and auth. */
function Client({ client }: { client: McpClientData }) {
  const instructions = MCP_CLIENT_INSTRUCTIONS[client.key]
  const primary = instructions?.primary?.({ isPlatform: IS_PLATFORM, url: HOSTED_URL })
  const alternate = instructions?.alternate?.({ isPlatform: IS_PLATFORM, url: HOSTED_URL })
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

      {instructions?.deepLinkDescription && instructionToMarkdown(instructions.deepLinkDescription)}

      {primary && instructionToMarkdown(primary)}

      {config ? (
        <>
          <paragraph>
            {primary ? 'Alternatively, add' : 'Add'} this configuration to{' '}
            <inlineCode value={config.file} />:
          </paragraph>
          <code lang={config.lang} value={config.value} />
        </>
      ) : !primary && client.externalDocsUrl ? (
        <paragraph>
          Available as a connector. Install it from the{' '}
          <link url={client.externalDocsUrl}>{client.label} directory</link>.
        </paragraph>
      ) : null}

      {alternate && instructionToMarkdown(alternate)}
    </>
  )
}

/**
 * Static markdown rendering of `<McpConfigPanel />` for the docs `.md` build.
 * Co-located with the React component and built from the same shared data and
 * instruction trees, so the markdown and the dashboard's Connect panel can't
 * drift. Authored with the mdast-jsx runtime; consumed by the docs markdown
 * pipeline.
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

export function mcpConfigPanelMarkdown(): string {
  const processor = remark().use(remarkGfm)
  return processor
    .stringify(McpConfigPanel() as unknown as Parameters<typeof processor.stringify>[0])
    .trim()
}
