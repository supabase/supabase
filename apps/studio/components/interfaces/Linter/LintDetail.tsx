import { createLintSummaryPrompt, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { Lint } from 'data/lint/lint-query'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button } from 'ui'

import { Markdown } from '../Markdown'
import { EntityTypeIcon, LintCTA, LintEntity } from './Linter.utils'

interface LintDetailProps {
  lint: Lint
  projectRef: string
  onAskAssistant?: () => void
}

const LintDetail = ({ lint, projectRef, onAskAssistant }: LintDetailProps) => {
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const handleAskAssistant = () => {
    track('advisor_assistant_button_clicked', {
      origin: 'lint_detail',
      advisorCategory: lint.categories[0],
      advisorType: lint.name,
      advisorLevel: lint.level,
    })

    onAskAssistant?.()
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({
      name: 'Summarize lint',
      initialMessage: createLintSummaryPrompt(lint),
    })
  }

  const buildPromptForCopy = () => {
    return createLintSummaryPrompt(lint)
  }

  return (
    <div>
      <h3 className="text-sm mb-2">Entity</h3>
      <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg text-sm mb-6 w-fit">
        <EntityTypeIcon type={lint.metadata?.type} />
        <LintEntity metadata={lint.metadata} />
      </div>

      <h3 className="text-sm mb-2">Issue</h3>
      <Markdown className="leading-6 text-sm text-foreground-light mb-6">
        {lint.detail.replace(/\\`/g, '`')}
      </Markdown>
      <h3 className="text-sm mb-2">Description</h3>
      <Markdown className="text-sm text-foreground-light mb-6">
        {lint.description.replace(/\\`/g, '`')}
      </Markdown>

      <h3 className="text-sm mb-2">Resolve</h3>
      <div className="flex items-center gap-2">
        <AiAssistantDropdown
          label="Ask Assistant"
          buildPrompt={buildPromptForCopy}
          onOpenAssistant={handleAskAssistant}
          telemetrySource="lint_detail"
        />
        <LintCTA title={lint.name} projectRef={projectRef} metadata={lint.metadata} />
        <Button asChild type="text">
          <Link
            href={
              lintInfoMap.find((item) => item.name === lint.name)?.docsLink ||
              `${DOCS_URL}/guides/database/database-linter`
            }
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
