import { ClipboardIcon, ExternalLinkIcon, WrenchIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export interface EgressDebugButtonProps {
  projectRef?: string | null
  orgSlug?: string
  /** Optional label of the largest egress source, e.g. "Storage Egress" */
  highestEgressType?: string | null
}

/**
 * Builds a debugging prompt pre-filled with the user's project context. It is
 * diagnose-first and does not assume the cause is in the user's code — the agent
 * is asked to confirm against the data (via MCP) and the code, and to say
 * whether each fix is code-side or Supabase-side.
 */
export const buildEgressDebugPrompt = ({
  projectRef,
  orgSlug,
  highestEgressType,
}: Pick<EgressDebugButtonProps, 'projectRef' | 'orgSlug' | 'highestEgressType'>) => {
  const ref = projectRef || '<your-project-ref>'
  const dashboard = `https://supabase.com/dashboard/project/${ref}`

  return [
    'I need help understanding and reducing egress (bandwidth) usage on my Supabase project.',
    'Diagnose with real data before changing anything. The cause may be in my code or in my Supabase configuration. Do not assume.',
    '',
    `Project ref: ${ref}`,
    highestEgressType ? `Largest egress source: ${highestEgressType}` : null,
    '',
    'Use the Supabase MCP to inspect my project directly. If it is not connected, set it up first: https://supabase.com/docs/guides/getting-started/mcp',
    '',
    'Investigate with the MCP tools:',
    '- query_logs / Logs Explorer: rank API and Storage paths by request count, and find cache misses. Dashboard: ' +
      `${dashboard}/logs/explorer`,
    '- execute_sql: inspect pg_stat_statements for the most frequent queries and the average rows they return (this is what Query Performance shows). Dashboard: ' +
      `${dashboard}/database/query-performance`,
    '- execute_sql: inspect my schema and data for likely sources — large or unoptimized objects in storage.objects, wide tables returned without column scoping, and queries reaching the auth or storage schemas.',
    '',
    'Then review MY application code: find where these paths and queries originate (direct Postgres connection or the PostgREST/Data API), and compare what I request against what I actually render or use.',
    '',
    'Recommend fixes and say whether each is in my code (scope columns, paginate, fewer calls, image transforms on fetch) or in my Supabase config (Smart CDN, Cache-Control headers, image transformations), based on the evidence.',
    '',
    'Read the egress guide for current best practice: https://supabase.com/docs/guides/platform/manage-your-usage/egress.md',
    'If the Supabase skill is installed, follow its guidance. Install it with: npx skills add supabase/agent-skills',
    orgSlug
      ? `Usage and billing for context: https://supabase.com/dashboard/org/${orgSlug}/usage#egress`
      : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/**
 * The human equivalent of the agent MCP log-debugging flow: copies a prompt
 * pre-filled with the project's data and links, or opens it in Claude or
 * ChatGPT. Shown in the usage Egress section. When no single project is in
 * scope it renders disabled with a tooltip, rather than disappearing.
 */
export const EgressDebugButton = ({
  projectRef,
  orgSlug,
  highestEgressType,
}: EgressDebugButtonProps) => {
  const prompt = buildEgressDebugPrompt({ projectRef, orgSlug, highestEgressType })

  const openWith = (baseUrl: string) => {
    const url = `${baseUrl}${encodeURIComponent(prompt)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!projectRef) {
    return (
      <ButtonTooltip
        disabled
        icon={<WrenchIcon />}
        tooltip={{
          content: { side: 'bottom', text: 'Select a single project to debug egress' },
        }}
      >
        Debug egress
      </ButtonTooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={<WrenchIcon />}>Debug egress</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Debug with an AI agent</DropdownMenuLabel>
        <DropdownMenuItem
          className="gap-2"
          onClick={() =>
            copyToClipboard(prompt, () => toast.success('Copied debug prompt to clipboard'))
          }
        >
          <ClipboardIcon size={14} />
          Copy debug prompt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={() => openWith('https://claude.ai/new?q=')}>
          <ExternalLinkIcon size={14} />
          Open in Claude
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => openWith('https://chatgpt.com/?q=')}>
          <ExternalLinkIcon size={14} />
          Open in ChatGPT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
