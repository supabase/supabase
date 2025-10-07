import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import { createLintSummaryPrompt, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { Lint } from 'data/lint/lint-query'
import { DOCS_URL } from 'lib/constants'
import { ExternalLink } from 'lucide-react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, Button } from 'ui'
import { EntityTypeIcon, LintCTA, LintEntity } from './Linter.utils'

interface LintDetailProps {
  lint: Lint
  projectRef: string
  onAskAssistant?: () => void
}

const LintDetail = ({ lint, projectRef, onAskAssistant }: LintDetailProps) => {
  const snap = useAiAssistantStateSnapshot()

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
        <Button
          icon={<AiIconAnimation className="scale-75 w-3 h-3" />}
          onClick={() => {
            onAskAssistant?.()
            snap.newChat({
              name: 'Summarize lint',
              open: true,
              initialInput: createLintSummaryPrompt(lint),
            })
          }}
        >
          Ask Assistant
        </Button>
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
