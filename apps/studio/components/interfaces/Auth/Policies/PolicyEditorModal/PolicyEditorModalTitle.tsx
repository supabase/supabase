import { noop } from 'lodash'
import { Button, IconChevronLeft, IconExternalLink } from 'ui'

import { POLICY_MODAL_VIEWS } from 'components/interfaces/Auth/Policies'
import { FlaskConical } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

interface PolicyEditorModalTitleProps {
  view: string
  schema: string
  table: string
  isNewPolicy: boolean
  showAssistantPreview: boolean
  onSelectBackFromTemplates: () => void
  onToggleFeaturePreviewModal: () => void
}

const PolicyEditorModalTitle = ({
  view,
  schema,
  table,
  isNewPolicy,
  showAssistantPreview,
  onSelectBackFromTemplates = noop,
  onToggleFeaturePreviewModal,
}: PolicyEditorModalTitleProps) => {
  const snap = useAppStateSnapshot()

  const getTitle = () => {
    if (view === POLICY_MODAL_VIEWS.EDITOR || view === POLICY_MODAL_VIEWS.SELECTION) {
      return `${isNewPolicy ? 'Adding new policy to' : 'Editing policy from'} ${schema}.${table}`
    }
    if (view === POLICY_MODAL_VIEWS.REVIEW) {
      return `Reviewing policy to be ${isNewPolicy ? 'created' : 'updated'} on ${schema}.${table}`
    }
  }

  if (view === POLICY_MODAL_VIEWS.TEMPLATES) {
    return (
      <div>
        <div className="flex items-center space-x-3">
          <span
            onClick={onSelectBackFromTemplates}
            className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
          >
            <IconChevronLeft strokeWidth={2} size={14} />
          </span>
          <h4>Select a template to use for your new policy</h4>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full flex items-center justify-between gap-x-4">
      <h4 className="truncate" title={getTitle()}>
        {getTitle()}
      </h4>
      <div className="flex items-center gap-x-2">
        {showAssistantPreview && view === POLICY_MODAL_VIEWS.EDITOR && (
          <Button
            type="default"
            icon={<FlaskConical size={14} />}
            onClick={onToggleFeaturePreviewModal}
          >
            Try Supabase Assistant
          </Button>
        )}
        <Button asChild type="default" icon={<IconExternalLink size={14} />}>
          <a
            href="https://supabase.com/docs/learn/auth-deep-dive/auth-policies"
            target="_blank"
            rel="noreferrer"
          >
            {' '}
            Documentation
          </a>
        </Button>
      </div>
    </div>
  )
}

export default PolicyEditorModalTitle
