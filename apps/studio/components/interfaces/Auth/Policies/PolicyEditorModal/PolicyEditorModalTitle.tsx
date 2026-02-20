import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { noop } from 'lodash'
import { ChevronLeft } from 'lucide-react'

import { POLICY_MODAL_VIEWS } from '../Policies.constants'

interface PolicyEditorModalTitleProps {
  view: string
  schema: string
  table: string
  isNewPolicy: boolean
  onSelectBackFromTemplates: () => void
}

export const PolicyEditorModalTitle = ({
  view,
  schema,
  table,
  isNewPolicy,
  onSelectBackFromTemplates = noop,
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
      <DocsButton className="mt-[-4px]" href={`${DOCS_URL}/learn/auth-deep-dive/auth-policies`} />
    </div>
  )
}
