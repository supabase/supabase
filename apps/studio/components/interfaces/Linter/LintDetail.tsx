import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import { createLintSummaryPrompt, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Lint } from 'data/lint/lint-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { ExternalLink } from 'lucide-react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Button } from 'ui'
import { EntityTypeIcon, LintAction, LintCTA, LintEntity } from './Linter.utils'

interface LintDetailProps {
  lint: Lint
  projectRef: string
  onAskAssistant?: () => void
}

const LintDetail = ({ lint, projectRef, onAskAssistant }: LintDetailProps) => {
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { data: project } = useSelectedProjectQuery()

  const lintInfo = lintInfoMap.find((item) => item.name === lint.name)

  return (
    <div>
      <h3 className="text-sm mb-2">Entity</h3>
      <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg text-sm mb-6 w-fit">
        <EntityTypeIcon type={lint.metadata?.type} />
        <LintEntity metadata={lint.metadata} />
      </div>

      <h3 className="text-sm mb-2">Issue</h3>
      <ReactMarkdown className="leading-6 text-sm text-foreground-light mb-6">
        {lint.detail.replace(/\\`/g, '`')}
      </ReactMarkdown>
      <h3 className="text-sm mb-2">Description</h3>
      <ReactMarkdown className="text-sm text-foreground-light mb-6">
        {lint.description.replace(/\\`/g, '`')}
      </ReactMarkdown>

      <h3 className="text-sm mb-2">Resolve</h3>
      <div className="flex items-center gap-2">
        <LintAction
          id={lint.name}
          projectRef={projectRef}
          connectionString={project?.connectionString}
          metadata={lint.metadata}
        />

        <LintCTA title={lint.name} projectRef={projectRef} metadata={lint.metadata} />
        <ButtonTooltip
          type="default"
          className="px-1"
          tooltip={{
            content: {
              side: 'bottom',
              text: 'Fix issue using Supabase Assistant',
            },
          }}
          onClick={() => {
            onAskAssistant?.()
            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            snap.newChat({
              name: 'Fix issue',
              initialInput: createLintSummaryPrompt(lint),
            })
          }}
        >
          <AiIconAnimation size={16} />
        </ButtonTooltip>
        <Button asChild type="text">
          <Link
            href={lintInfo?.docsLink || `${DOCS_URL}/guides/database/database-linter`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            <span className="flex items-center gap-2">
              Learn more <ExternalLink size={14} />
            </span>
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default LintDetail
