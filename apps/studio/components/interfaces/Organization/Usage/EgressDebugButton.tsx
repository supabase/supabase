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
 * Builds a debugging prompt pre-filled with the user's project context and
 * links. It is diagnose-first and does not assume the cause is in the user's
 * code — the agent is asked to confirm against the data and the code, and to
 * say whether each fix is code-side or Supabase-side.
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
    'Diagnose before changing anything. The cause may be in my code or in my Supabase configuration. Do not assume.',
    '',
    `Project ref: ${ref}`,
    highestEgressType ? `Largest egress source: ${highestEgressType}` : null,
    '',
    'My data:',
    `- Egress report: ${dashboard}/observability/egress`,
    `- Logs Explorer: ${dashboard}/logs/explorer`,
    `- Query Performance: ${dashboard}/database/query-performance`,
    orgSlug
      ? `- Usage and billing: https://supabase.com/dashboard/org/${orgSlug}/usage#egress`
      : null,
    '',
    'Please:',
    '1. Read the egress guide: https://supabase.com/docs/guides/platform/manage-your-usage/egress.md',
    '2. If the Supabase MCP is connected, query my logs and Query Performance to confirm what drives egress. If not, set it up: https://supabase.com/docs/guides/getting-started/mcp',
    '3. Review my code for how I call these paths. Compare what I request against what I use.',
    '4. Recommend fixes. Say whether each fix is in my code or my Supabase config, based on the data.',
    '',
    'If the Supabase skill is installed, follow its guidance. Install it with: npx skills add supabase/agent-skills',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

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

  // The prompt needs a single project's context to be useful. When viewing all
  // projects, show a disabled button that explains what to do rather than
  // hiding it.
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
