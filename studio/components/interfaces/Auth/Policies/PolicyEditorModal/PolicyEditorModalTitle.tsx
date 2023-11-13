import { noop } from 'lodash'
import { IconChevronLeft, IconX } from 'ui'

import { POLICY_MODAL_VIEWS } from 'components/interfaces/Auth/Policies'

interface PolicyEditorModalTitleProps {
  view: string
  schema: string
  table: string
  isNewPolicy: boolean
  onSelectBackFromTemplates: () => void
  setIsClosingPolicyEditorModal: (value: boolean) => void
}

const PolicyEditorModalTitle = ({
  view,
  schema,
  table,
  isNewPolicy,
  onSelectBackFromTemplates = noop,
  setIsClosingPolicyEditorModal,
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
      <div className="flex justify-between items-center w-full ">
        <div className="flex items-center space-x-3">
          <span
            onClick={onSelectBackFromTemplates}
            className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
          >
            <IconChevronLeft strokeWidth={2} size={14} />
          </span>
          <h4 className="m-0 text-lg">Select a template to use for your new policy</h4>
        </div>
        <button onClick={() => setIsClosingPolicyEditorModal(true)}>
          <IconX size={18} className="" />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center space-x-3 justify-between w-full">
      <h4 className="m-0 truncate text-lg">{getTitle()}</h4>
      <button onClick={() => setIsClosingPolicyEditorModal(true)}>
        <IconX size={18} className="" />
      </button>
    </div>
  )
}

export default PolicyEditorModalTitle
