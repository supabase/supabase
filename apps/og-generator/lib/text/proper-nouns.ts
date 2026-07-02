/**
 * Acronym / proper-noun allowlist for sentence-case formatting (brief §3).
 *
 * When the headline is auto-sentence-cased, any term here is restored to its
 * exact canonical casing instead of being lowercased. This is intentionally a
 * plain editable list so PMM/DevRel can grow it WITHOUT a code change — the only
 * rule is: write each term exactly as it should appear in output.
 *
 * Matching is whole-word and case-insensitive; longer terms win over shorter.
 */
export const PROPER_NOUNS: string[] = [
  // Supabase + Postgres ecosystem
  'Supabase',
  'Postgres',
  'PostgreSQL',
  'pgvector',
  'PostgREST',
  'PgBouncer',
  'pg_cron',
  'Realtime',
  'Edge Functions',
  // Languages / formats / protocols
  'SQL',
  'JSON',
  'CSV',
  'GraphQL',
  'TypeScript',
  'JavaScript',
  'WebAssembly',
  'HTTP',
  'HTTPS',
  'WebSocket',
  'WebSockets',
  // Auth / security
  'OAuth',
  'JWT',
  'RLS',
  'SSO',
  'MFA',
  'SAML',
  // General tech acronyms
  'API',
  'APIs',
  'SDK',
  'SDKs',
  'CLI',
  'UI',
  'UX',
  'URL',
  'URLs',
  'CDN',
  'ORM',
  'S3',
  'AI',
  'LLM',
  'LLMs',
  'RAG',
  'MCP',
  'iOS',
  'macOS',
  // Vendors / frameworks commonly named in posts
  'Next.js',
  'Deno',
  'Vercel',
  'GitHub',
  'Flutter',
]
