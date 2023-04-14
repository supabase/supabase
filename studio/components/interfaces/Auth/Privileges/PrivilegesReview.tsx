import SqlEditor from 'components/ui/SqlEditor'
import { FC } from 'react'
import { Button, Modal } from 'ui'

interface Props {
  isSaving: boolean
  sqlStatement: string
  onSelectBack: () => void
  onSelectSave: () => void
}

const PrivilegesReview: FC<Props> = (props: Props) => {
  return (
    <>
      <Modal.Content>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-between space-y-8">
            <div className="flex flex-col">
              <p className="text-sm text-scale-1100">
                This is the SQL statement that will be used to apply your changes.
              </p>
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
            <div className="space-y-2">
              <div className="h-40">
                <SqlEditor readOnly defaultValue={props.sqlStatement} />
              </div>
            </div>
          </div>
        </div>
      </Modal.Content>
      <div className="flex w-full items-center justify-end gap-2 border-t px-6 py-4 dark:border-dark">
        <Button type="default" onClick={props.onSelectBack}>
          Back to edit
        </Button>
        <Button type="primary" onClick={props.onSelectSave} loading={props.isSaving}>
          Save
        </Button>
      </div>
    </>
  )
}

export default PrivilegesReview
