import { PLUGIN_CLIENTS } from '~/features/ui/AgentPluginsPanel.data'
import type { ContentListingGroup } from '~/lib/content-listings.schema'
import { MCP_CLIENT_DATA } from 'ui-patterns/McpUrlBuilder/clients.data'

// MCP_CLIENT_DATA and PLUGIN_CLIENTS key GitHub Copilot differently — normalize before merging.
const KEY_ALIASES: Record<string, string> = {
  'copilot-cli': 'github-copilot',
}

// ContentListings defaults hasLightIcon to true for string icon paths (see
// ContentListings.client.tsx: `item.hasLightIcon ?? typeof item.icon === 'string'`), so
// single-variant icons must set `hasLightIcon: false` explicitly or they'll request a
// nonexistent "-light" file.
const ICON_ASSETS: Record<string, { icon: string; hasLightIcon?: boolean }> = {
  'claude-code': { icon: '/docs/img/icons/agent-claude-icon', hasLightIcon: false },
  codex: { icon: '/docs/img/icons/agent-openai-icon', hasLightIcon: true },
  cursor: { icon: '/docs/img/icons/agent-cursor-icon', hasLightIcon: true },
  'gemini-cli': { icon: '/docs/img/icons/agent-gemini-cli-icon', hasLightIcon: false },
  'github-copilot': { icon: '/docs/img/icons/agent-copilot-icon', hasLightIcon: true },
  kimi: { icon: '/docs/img/icons/agent-kimi-icon', hasLightIcon: true },
  vscode: { icon: '/docs/img/icons/agent-vscode-icon', hasLightIcon: false },
  antigravity: { icon: '/docs/img/icons/agent-antigravity-icon', hasLightIcon: false },
  windsurf: { icon: '/docs/img/icons/agent-windsurf-icon', hasLightIcon: true },
  goose: { icon: '/docs/img/icons/agent-goose-icon', hasLightIcon: true },
  factory: { icon: '/docs/img/icons/agent-factory-icon', hasLightIcon: true },
  opencode: { icon: '/docs/img/icons/agent-opencode-icon', hasLightIcon: true },
  kiro: { icon: '/docs/img/icons/agent-kiro-icon', hasLightIcon: false },
}

// Claude.ai and ChatGPT are MCP connectors for a chat web app, not a coding agent or IDE.
const EXCLUDED_KEYS = new Set(['claude-ai', 'chatgpt'])

// Each product's own tagline, sourced from its marketing site (or, where noted, an official
// GitHub repo description or last-known pre-acquisition tagline). Not Supabase-specific copy —
// see the "Open questions" note in the PR for the Windsurf/Devin caveat.
const TAGLINES: Record<string, string> = {
  antigravity: 'Experience liftoff with the next-gen agent platform.',
  'claude-code': 'Work with Claude directly in your codebase, from your terminal, IDE, and more.',
  codex: 'A lightweight coding agent that runs in your terminal.',
  cursor: 'Your coding agent for building ambitious software.',
  factory: 'A self-improving system for your SDLC.',
  'gemini-cli': 'Build, debug & deploy with AI.',
  'github-copilot': 'Your AI accelerator for every workflow, from the editor to the enterprise.',
  goose: 'Your native open source AI agent — desktop app, CLI, and API.',
  kimi: 'Engineered to drop into any dev workflow and get programming tasks done fast.',
  kiro: 'Move beyond AI coding to agentic engineering.',
  opencode: 'The open source AI coding agent.',
  vscode: 'The open source AI code editor — your home for multi-agent development.',
  // Pre-acquisition tagline (Cognition/Devin acquired Windsurf in 2025) — see "Open questions".
  windsurf: "The first agentic IDE. Tomorrow's editor, today.",
}

interface AgentEntry {
  key: string
  label: string
  plugin: boolean
  mcp: boolean
}

const PLUGIN_KEYS = new Set(PLUGIN_CLIENTS.map((client) => client.key))
const MCP_KEYS = new Set(MCP_CLIENT_DATA.map((client) => KEY_ALIASES[client.key] ?? client.key))

function buildAgents(): AgentEntry[] {
  const byKey = new Map<string, AgentEntry>()

  for (const client of MCP_CLIENT_DATA) {
    const key = KEY_ALIASES[client.key] ?? client.key
    if (EXCLUDED_KEYS.has(key)) continue
    byKey.set(key, {
      key,
      label: client.label,
      plugin: PLUGIN_KEYS.has(key),
      mcp: true,
    })
  }

  for (const client of PLUGIN_CLIENTS) {
    if (EXCLUDED_KEYS.has(client.key)) continue
    if (byKey.has(client.key)) continue
    byKey.set(client.key, {
      key: client.key,
      label: client.label,
      plugin: true,
      mcp: MCP_KEYS.has(client.key),
    })
  }

  return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function badgeFor(plugin: boolean, mcp: boolean): string {
  if (plugin && mcp) return 'Plugin + MCP'
  if (plugin) return 'Plugin'
  return 'MCP'
}

// Route to our own setup instructions rather than each vendor's external docs.
function hrefFor(agent: AgentEntry): string {
  return agent.plugin ? '/guides/ai-tools/plugins' : '/guides/ai-tools/mcp'
}

export const aiToolsSupportedAgents: ContentListingGroup = {
  id: 'ai-tools-supported-agents',
  type: 'grid',
  columns: 3,
  items: buildAgents().map((agent) => ({
    title: agent.label,
    href: hrefFor(agent),
    description: TAGLINES[agent.key] ?? 'Connect using the Supabase MCP server or plugin.',
    icon: ICON_ASSETS[agent.key]?.icon,
    hasLightIcon: ICON_ASSETS[agent.key]?.hasLightIcon,
    badge: badgeFor(agent.plugin, agent.mcp),
    badgePosition: 'below',
  })),
}

export const aiToolsBuildingIntoApp: ContentListingGroup = {
  id: 'ai-tools-building-into-app',
  heading: 'Building AI into your app?',
  headingLevel: 'h2',
  description:
    "The tools above are for your development workflow. If you're building AI capabilities into your own product:",
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Deploy MCP servers',
      href: '/guides/ai-tools/byo-mcp',
      description:
        'Host your own MCP server on Supabase Edge Functions so your users can connect their AI agents to your product',
      icon: '/docs/img/icons/product-edge-functions-icon',
      hasLightIcon: true,
    },
    {
      title: 'Vectors / Embeddings',
      href: '/guides/ai',
      description:
        'Build semantic search, RAG pipelines, and other AI-powered features using pgvector',
      icon: '/docs/img/icons/product-vector-icon',
      hasLightIcon: true,
    },
  ],
}
