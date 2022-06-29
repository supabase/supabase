import { FC } from 'react'
import { IconChevronLeft } from '@supabase/ui'
import { POLICY_MODAL_VIEWS } from 'components/interfaces/Authentication/Policies'

interface Props {
  view: string
  schema: string
  table: string
  isNewPolicy: boolean
  onSelectBackFromTemplates: () => void
}

const PolicyEditorModalTitle: FC<Props> = ({
  view,
  schema,
  table,
  isNewPolicy,
  onSelectBackFromTemplates = () => {},
}) => {
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
      <div className="">
        <div className="flex items-center space-x-3">
          <span
            onClick={onSelectBackFromTemplates}
            className="text-scale-900 hover:text-scale-1200 cursor-pointer transition-colors"
          >
            <IconChevronLeft strokeWidth={2} size={14} />
          </span>
          <h4 className="m-0 text-lg">Select a template to use for your new policy</h4>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center space-x-3">
      <h4 className="m-0 text-lg">{getTitle()}</h4>
    </div>
  )
}

export default PolicyEditorModalTitle
