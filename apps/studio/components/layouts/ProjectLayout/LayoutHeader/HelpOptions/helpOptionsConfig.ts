import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'

export type HelpOptionId =
  | 'assistant'
  | 'docs'
  | 'troubleshooting'
  | 'discord'
  | 'status'
  | 'support'

export const HELP_OPTION_IDS = [
  'assistant',
  'docs',
  'troubleshooting',
  'discord',
  'status',
  'support',
] as const satisfies readonly HelpOptionId[]

export const ASSISTANT_SUGGESTIONS = {
  name: 'Support' as const,
  initialInput: 'I need help with my project',
  suggestions: {
    title: 'I can help you with your project, here are some example prompts to get you started:',
    prompts: [
      { label: 'Database Health', description: 'Summarise my database health and performance' },
      { label: 'Debug Logs', description: 'View and debug my edge function logs' },
      { label: 'RLS Setup', description: 'Implement row level security for my tables' },
    ],
  },
}

export function getSupportLinkQueryParams(
  project: { parent_project_ref?: string } | undefined,
  org: { slug?: string } | undefined,
  routerRef: string | undefined
): Partial<SupportFormUrlKeys> | undefined {
  const projectRef = project?.parent_project_ref ?? routerRef
  if (projectRef) return { projectRef }
  if (org?.slug) return { orgSlug: org.slug }
  return undefined
}
