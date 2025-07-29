import { noop } from 'lodash'
import { ChevronLeft, FlaskConical } from 'lucide-react'

import { DocsButton } from 'components/ui/DocsButton'
import { Button } from 'ui'
import { POLICY_MODAL_VIEWS } from '../Policies.constants'

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
            <ChevronLeft strokeWidth={2} size={14} />
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
      <div className="flex items-center gap-x-2 pr-6">
        {showAssistantPreview && view === POLICY_MODAL_VIEWS.EDITOR && (
          <Button type="default" icon={<FlaskConical />} onClick={onToggleFeaturePreviewModal}>
            Try Supabase Assistant
          </Button>
        )}
        <DocsButton
          className="mt-[-4px]"
          href="https://supabase.com/docs/learn/auth-deep-dive/auth-policies"
        />
      </div>
    </div>
  )
}

export default PolicyEditorModalTitle
