import Link from 'next/link'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { EntityTypeIcon, LintCTA, LintEntity } from './Linter.utils'

interface LintDetailProps {
  lint: Lint
  projectRef: string
  onAskAssistant?: () => void
}

const LintDetail = ({ lint, projectRef, onAskAssistant }: LintDetailProps) => {
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const [isRunningAction, setIsRunningAction] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)

  const lintInfo = lintInfoMap.find((item) => item.name === lint.name)
  const actionConfirm = lintInfo?.action?.confirm

  const handleRunAction = async () => {
    if (!lintInfo?.action || !projectRef) return
    setIsRunningAction(true)
    try {
      await lintInfo.action.run({
        projectRef,
        connectionString: project?.connectionString,
        metadata: lint.metadata,
      })
      toast.success(`${lintInfo.action.label} successful`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run action'
      toast.error(message)
    } finally {
      setIsRunningAction(false)
      setIsConfirmVisible(false)
    }
  }

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
        {lintInfo?.action && (
          <Button
            type="primary"
            loading={isRunningAction}
            onClick={() => {
              if (actionConfirm) {
                setIsConfirmVisible(true)
              } else {
                handleRunAction()
              }
            }}
          >
            {lintInfo.action.label}
          </Button>
        )}

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

      {lintInfo?.action && actionConfirm && (
        <ConfirmationModal
          visible={isConfirmVisible}
          loading={isRunningAction}
          title={actionConfirm.title({
            projectRef,
            connectionString: project?.connectionString,
            metadata: lint.metadata,
          })}
          description={
            actionConfirm.description?.({
              projectRef,
              connectionString: project?.connectionString,
              metadata: lint.metadata,
            }) ?? undefined
          }
          confirmLabel={actionConfirm.confirmLabel ?? 'Confirm'}
          cancelLabel={actionConfirm.cancelLabel}
          variant={actionConfirm.variant ?? 'default'}
          onCancel={() => setIsConfirmVisible(false)}
          onConfirm={handleRunAction}
        />
      )}
    </div>
  )
}

export default LintDetail
