import type { RemoteToolContract } from './types'

export const contract = {
  name: 'search_docs',
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- When users ask about Supabase features, limitations, or capabilities, or for tasks (e.g. "How do I...", "Can Supabase...", "Is it possible to..."), use \`search_docs\` FIRST, before making claims, attempting database operations, or gathering database context.
- Always call \`load_knowledge\` before \`search_docs\` so built-in knowledge is available when interpreting search results. \`search_docs\` does NOT replace the need for \`load_knowledge\`.
- If \`search_docs\` reveals a limitation, inform the user immediately without gathering database context.
- Do not make claims unsupported by documentation.
- Always call \`search_docs\` before providing any links to Supabase documentation or dashboard pages.
- Never respond to billing or account requests without using \`search_docs\` to find the relevant documentation first.`,
} as const satisfies RemoteToolContract
