// Build-time generator: extracts a curated set of Lucide icons (ISC) from the
// `lucide-static` dev dependency into lib/assets/lucide-icons.ts, in the same
// SeedIcon shape the renderer/picker already use. Re-run after editing CURATED:
//   node apps/og-generator/scripts/gen-lucide-icons.mjs
//
// Tags are authored here (not from Lucide metadata) so they match the words a
// Supabase blog writer would actually use — that's what the matcher/LLM search.
// Names must match a Lucide icon filename; missing ones are skipped with a warn.
// Seed-icon names (database, lock, layers, zap, globe) are intentionally omitted
// to avoid colliding with lib/assets/seed-icons.ts.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const iconsDir = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons')
const outFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/assets/lucide-icons.ts')

const CURATED = [
  { name: 'server', label: 'Server', tags: ['server', 'backend', 'host', 'compute', 'deployment', 'infrastructure', 'api'] },
  { name: 'cloud', label: 'Cloud', tags: ['cloud', 'hosting', 'saas', 'storage', 'backup', 'platform'] },
  { name: 'shield', label: 'Shield', tags: ['security', 'protection', 'safe', 'defense', 'trust', 'compliance'] },
  { name: 'shield-check', label: 'Shield check', tags: ['security', 'verified', 'compliance', 'audit', 'trust', 'soc2'] },
  { name: 'key', label: 'Key', tags: ['auth', 'api key', 'secret', 'credentials', 'access', 'token', 'authentication'] },
  { name: 'users', label: 'Users', tags: ['team', 'users', 'collaboration', 'community', 'accounts', 'multiplayer'] },
  { name: 'user', label: 'User', tags: ['user', 'account', 'profile', 'identity', 'auth', 'session'] },
  { name: 'code', label: 'Code', tags: ['code', 'developer', 'programming', 'snippet', 'api', 'sdk'] },
  { name: 'terminal', label: 'Terminal', tags: ['cli', 'terminal', 'command', 'shell', 'devtools', 'console'] },
  { name: 'git-branch', label: 'Branch', tags: ['git', 'branch', 'version control', 'workflow', 'ci', 'preview'] },
  { name: 'cpu', label: 'CPU', tags: ['compute', 'performance', 'processing', 'hardware', 'cpu', 'edge'] },
  { name: 'network', label: 'Network', tags: ['network', 'connections', 'graph', 'distributed', 'mesh', 'topology'] },
  { name: 'box', label: 'Box', tags: ['package', 'container', 'box', 'bundle', 'storage', 'object'] },
  { name: 'package', label: 'Package', tags: ['package', 'module', 'library', 'dependency', 'release', 'bundle'] },
  { name: 'activity', label: 'Activity', tags: ['analytics', 'monitoring', 'metrics', 'activity', 'observability', 'logs', 'uptime'] },
  { name: 'chart-column', label: 'Chart', tags: ['analytics', 'chart', 'metrics', 'dashboard', 'stats', 'reporting', 'growth'] },
  { name: 'search', label: 'Search', tags: ['search', 'query', 'find', 'discovery', 'full text', 'index', 'lookup'] },
  { name: 'bell', label: 'Bell', tags: ['notifications', 'alerts', 'webhooks', 'events', 'reminders'] },
  { name: 'mail', label: 'Mail', tags: ['email', 'mail', 'messaging', 'notifications', 'transactional', 'smtp'] },
  { name: 'folder', label: 'Folder', tags: ['storage', 'files', 'folder', 'buckets', 'organization', 'objects'] },
  { name: 'file-text', label: 'File', tags: ['file', 'document', 'content', 'docs', 'text', 'markdown'] },
  { name: 'settings', label: 'Settings', tags: ['settings', 'config', 'configuration', 'controls', 'preferences', 'options'] },
  { name: 'webhook', label: 'Webhook', tags: ['webhook', 'events', 'integration', 'api', 'callback', 'trigger'] },
  { name: 'workflow', label: 'Workflow', tags: ['workflow', 'automation', 'pipeline', 'orchestration', 'jobs', 'queue'] },
  { name: 'bot', label: 'Bot', tags: ['ai', 'bot', 'agent', 'assistant', 'automation', 'llm', 'chat'] },
  { name: 'sparkles', label: 'Sparkles', tags: ['ai', 'magic', 'generate', 'new', 'launch', 'features', 'smart'] },
  { name: 'rocket', label: 'Rocket', tags: ['launch', 'ship', 'release', 'startup', 'growth', 'deploy'] },
  { name: 'plug', label: 'Plug', tags: ['integration', 'connect', 'plugin', 'extension', 'connector', 'api'] },
  { name: 'lock-keyhole', label: 'Lock keyhole', tags: ['security', 'private', 'encryption', 'rls', 'access', 'protected'] },
  { name: 'table', label: 'Table', tags: ['table', 'data', 'rows', 'columns', 'postgres', 'schema', 'sql'] },
  { name: 'workflow', label: 'Workflow', tags: ['workflow', 'automation', 'pipeline'] },
  // Metrics/graphs.
  { name: 'trending-up', label: 'Trending up', tags: ['metrics', 'growth', 'analytics', 'performance', 'trend', 'benchmark'] },
  { name: 'chart-line', label: 'Line chart', tags: ['analytics', 'chart', 'metrics', 'graph', 'trend', 'reporting', 'dashboard'] },
  { name: 'chart-pie', label: 'Pie chart', tags: ['analytics', 'chart', 'metrics', 'breakdown', 'distribution', 'reporting'] },
  { name: 'chart-area', label: 'Area chart', tags: ['analytics', 'chart', 'metrics', 'usage', 'reporting', 'dashboard'] },
  { name: 'gauge', label: 'Gauge', tags: ['performance', 'metrics', 'benchmark', 'speed', 'latency', 'monitoring'] },
  { name: 'layout-dashboard', label: 'Dashboard', tags: ['dashboard', 'observability', 'overview', 'admin', 'studio', 'metrics'] },
  { name: 'monitor', label: 'Monitor', tags: ['monitoring', 'observability', 'uptime', 'dashboard', 'alerts', 'metrics'] },
  // Postgres/data.
  { name: 'database-backup', label: 'Database backup', tags: ['backup', 'postgres', 'database', 'recovery', 'snapshot', 'disaster recovery'] },
  { name: 'binary', label: 'Binary', tags: ['data', 'encoding', 'bits', 'storage', 'compute', 'types'] },
  { name: 'function-square', label: 'Function', tags: ['edge functions', 'serverless', 'compute', 'functions', 'deno'] },
  { name: 'braces', label: 'Braces', tags: ['json', 'api', 'schema', 'data', 'config', 'payload'] },
  { name: 'columns-3', label: 'Columns', tags: ['schema', 'postgres', 'columns', 'table', 'data model', 'migrations'] },
  { name: 'list-tree', label: 'Tree', tags: ['schema', 'hierarchy', 'structure', 'nested', 'tree', 'relationships'] },
  // Realtime/collaboration.
  { name: 'refresh-cw', label: 'Refresh', tags: ['realtime', 'sync', 'replication', 'refresh', 'live', 'streaming'] },
  { name: 'share-2', label: 'Share', tags: ['realtime', 'collaboration', 'sharing', 'broadcast', 'multiplayer', 'presence'] },
  // Auth/security.
  { name: 'fingerprint', label: 'Fingerprint', tags: ['auth', 'biometric', 'identity', 'security', 'mfa', 'authentication'] },
  { name: 'globe-lock', label: 'Globe lock', tags: ['security', 'global', 'compliance', 'data residency', 'privacy'] },
  // Dev workflow / ecosystem.
  { name: 'git-merge', label: 'Git merge', tags: ['git', 'version control', 'branch', 'merge', 'ci', 'pull request'] },
  { name: 'history', label: 'History', tags: ['changelog', 'migrations', 'audit log', 'version history', 'timeline'] },
  { name: 'puzzle', label: 'Puzzle', tags: ['integrations', 'extensions', 'plugins', 'ecosystem', 'add-ons'] },
]

function extract(name) {
  const file = path.join(iconsDir, `${name}.svg`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  if (!m) return null
  const body = m[1].replace(/\s+/g, ' ').trim()
  return body || null
}

const seen = new Set()
const icons = []
for (const { name, label, tags } of CURATED) {
  if (seen.has(name)) continue
  const body = extract(name)
  if (!body) {
    console.warn(`skip: ${name} (not found in lucide-static)`)
    continue
  }
  seen.add(name)
  icons.push({ name, label, tags, viewBox: '0 0 24 24', body })
}

const header = `// AUTO-GENERATED by scripts/gen-lucide-icons.mjs — do not edit by hand.
// Curated Lucide icons (ISC license) in SeedIcon shape. Re-run the script to update.
import type { SeedIcon } from '@/lib/assets/seed-icons'
`
const out = `${header}\nexport const LUCIDE_ICONS: SeedIcon[] = ${JSON.stringify(icons, null, 2)}\n`
fs.writeFileSync(outFile, out)
console.log(`wrote ${icons.length} icons → ${path.relative(process.cwd(), outFile)}`)
