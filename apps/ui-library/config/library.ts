import { componentPages, mcpBlocks, oauthBlocks, platformBlocks } from './docs'

export const libraryCategories = [
  {
    name: 'Starter apps',
    slug: 'starter-apps',
    description: 'Complete starting points for your next product.',
  },
  {
    name: 'Authentication',
    slug: 'authentication',
    description: 'Sign-in, sessions, and account management.',
  },
  { name: 'Database', slug: 'database', description: 'Connect your interface to Postgres data.' },
  { name: 'Storage', slug: 'storage', description: 'Upload files with Supabase Storage.' },
  { name: 'Realtime', slug: 'realtime', description: 'Build experiences that stay in sync.' },
  {
    name: 'Messaging',
    slug: 'messaging',
    description: 'Bring conversations into your application.',
  },
  { name: 'AI & APIs', slug: 'ai-apis', description: 'Connect agents to your application.' },
  {
    name: 'Application foundations',
    slug: 'application-foundations',
    description: 'Connect and extend your Supabase project.',
  },
] as const

export type LibraryCategory = (typeof libraryCategories)[number]['name']
export type CatalogPreviewKind =
  | 'auth'
  | 'social'
  | 'consent'
  | 'avatar'
  | 'table'
  | 'storage'
  | 'cursors'
  | 'editor'
  | 'flow'
  | 'avatars'
  | 'chat'
  | 'mcp'
  | 'dashboard'
  | 'client'

export type LibraryBlock = {
  slug: string
  title: string
  description: string
  category: LibraryCategory
  preview: CatalogPreviewKind
  tags: string[]
  href: string
  supportedFrameworks?: string[]
  frameworkLabel?: string
  external?: boolean
}

const blockMetadata: Record<string, Pick<LibraryBlock, 'description' | 'category' | 'preview'>> = {
  'password-based-auth': {
    description: 'Sign in and sign up with email and password.',
    category: 'Authentication',
    preview: 'auth',
  },
  'social-auth': {
    description: 'OAuth sign-in flows for popular providers.',
    category: 'Authentication',
    preview: 'social',
  },
  'oauth-consent': {
    description: 'Let users review and approve application access.',
    category: 'Authentication',
    preview: 'consent',
  },
  'current-user-avatar': {
    description: 'Display the signed-in user’s avatar and profile.',
    category: 'Authentication',
    preview: 'avatar',
  },
  'infinite-query': {
    description: 'Fetch and paginate Supabase data as users scroll.',
    category: 'Database',
    preview: 'table',
  },
  dropzone: {
    description: 'Drag-and-drop file uploads with progress tracking.',
    category: 'Storage',
    preview: 'storage',
  },
  'realtime-cursor': {
    description: 'Share live cursor positions across your application.',
    category: 'Realtime',
    preview: 'cursors',
  },
  'realtime-monaco': {
    description: 'Edit code together with a collaborative Monaco editor.',
    category: 'Realtime',
    preview: 'editor',
  },
  'realtime-flow': {
    description: 'Build collaborative diagrams with React Flow.',
    category: 'Realtime',
    preview: 'flow',
  },
  'realtime-avatar-stack': {
    description: 'Show who is online with a live avatar stack.',
    category: 'Realtime',
    preview: 'avatars',
  },
  'realtime-chat': {
    description: 'Send and receive messages in realtime.',
    category: 'Messaging',
    preview: 'chat',
  },
  'mcp-server': {
    description: 'Add a user-scoped MCP server to your product.',
    category: 'AI & APIs',
    preview: 'mcp',
  },
  client: {
    description: 'Set up a Supabase client for your framework.',
    category: 'Application foundations',
    preview: 'client',
  },
  'platform-kit': {
    description: 'Embed Supabase project management in your platform.',
    category: 'Application foundations',
    preview: 'dashboard',
  },
}

// Starter guides share the same documentation routes and layout as individual blocks.
const starterApps: LibraryBlock[] = [
  {
    title: 'Next.js starter',
    slug: 'nextjs-starter',
    description: 'A Next.js app with cookie-based authentication, TypeScript, and Tailwind CSS.',
    category: 'Starter apps',
    preview: 'auth',
    tags: ['Next.js', 'Authentication', 'TypeScript'],
    href: '/docs/starters/nextjs-starter',
    frameworkLabel: 'Next.js',
  },
  {
    title: 'SaaS starter',
    slug: 'saas-starter',
    description: 'Subscription payments with Stripe, Supabase, and Next.js.',
    category: 'Starter apps',
    preview: 'dashboard',
    tags: ['Next.js', 'Stripe', 'Subscriptions'],
    href: '/docs/starters/saas-starter',
    frameworkLabel: 'Next.js',
  },
  {
    title: 'AI chat app',
    slug: 'ai-chat-app',
    description: 'A conversational app with Next.js, the Vercel AI SDK, and Supabase.',
    category: 'Starter apps',
    preview: 'chat',
    tags: ['Next.js', 'AI', 'Messaging'],
    href: '/docs/starters/ai-chat-app',
    frameworkLabel: 'Next.js',
  },
  {
    title: 'Flutter starter',
    slug: 'flutter-starter',
    description: 'A user management app with authentication, profiles, and file storage.',
    category: 'Starter apps',
    preview: 'avatar',
    tags: ['Flutter', 'Authentication', 'Storage'],
    href: '/docs/starters/flutter-starter',
    frameworkLabel: 'Flutter',
  },
]

export const libraryBlocks: LibraryBlock[] = [
  ...starterApps,
  ...[
    ...componentPages.items,
    ...oauthBlocks.items,
    ...mcpBlocks.items,
    ...platformBlocks.items,
  ].map((item) => {
    const slug = item.href!.split('/').pop()!
    return {
      slug,
      title: item.title,
      href: item.href!,
      supportedFrameworks: item.supportedFrameworks,
      tags: item.supportedFrameworks ?? [],
      ...blockMetadata[slug],
    }
  }),
]

export function getLibraryBlockHref(block: LibraryBlock, framework?: string) {
  return framework && block.supportedFrameworks?.includes(framework)
    ? `/docs/${framework}/${block.slug}`
    : block.href
}

export function getLibraryCategoryHref(category: LibraryCategory) {
  return `/?category=${encodeURIComponent(category)}`
}
