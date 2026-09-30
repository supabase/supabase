export type StarterSource = {
  name: string
  title: string
  framework: 'nextjs' | 'flutter'
  repository: string
  root: string
}

export type StarterSourceSnapshot = {
  name: string
  framework: StarterSource['framework']
  source: {
    repository: string
    root: string
    revision: string
    treeUrl: string
  }
  files: { path: string; content?: string }[]
}

export const starterSources: readonly StarterSource[] = [
  {
    name: 'saas-starter',
    title: 'SaaS Starter',
    framework: 'nextjs',
    repository: 'supabase-community/nextjs-subscription-payments',
    root: '',
  },
  {
    name: 'ai-chat-app',
    title: 'AI Chat App',
    framework: 'nextjs',
    repository: 'supabase-community/vercel-ai-chatbot',
    root: '',
  },
  {
    name: 'flutter-starter',
    title: 'Flutter Starter',
    framework: 'flutter',
    repository: 'supabase/supabase',
    root: 'examples/user-management/flutter-user-management',
  },
]
