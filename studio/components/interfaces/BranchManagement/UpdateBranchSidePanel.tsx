import { useParams } from 'common'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch } from 'data/branches/branches-query'
import { useStore } from 'hooks'
import { useRef } from 'react'
import { Button, Form, Input, SidePanel } from 'ui'

interface UpdateBranchSidePanelProps {
  selectedBranch?: Branch
  onClose: () => void
}

const UpdateBranchSidePanel = ({ selectedBranch, onClose }: UpdateBranchSidePanelProps) => {
  const { ui } = useStore()
  const submitRef: any = useRef()
  const { ref: projectRef } = useParams()
  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onSuccess: () => {
      onClose()
      ui.setNotification({ category: 'success', message: 'Successfully updated branch' })
    },
  })

  const formId = 'update-branch-form'
  const initialValues = {
    branchName: selectedBranch?.name,
    gitBranch: selectedBranch?.git_branch,
  }

  const validate = (values: any) => {
    const errors: any = {}
    if (values.branchName.length === 0) errors.branchName = 'Please provide a branch name'
    if (values.gitBranch.length === 0) errors.gitBranch = 'Please provide a Git branch'
    return errors
  }

  const onConfirmUpdate = (values: any) => {
    if (selectedBranch === undefined) return console.error('No branch selected')
    if (projectRef === undefined) return console.error('Project ref is required')
    updateBranch({ ...values, id: selectedBranch.id, projectRef })
  }

  return (
    <SidePanel
      visible={selectedBranch !== undefined}
      header={`Update branch: ${selectedBranch?.name}`}
      onCancel={onClose}
      customFooter={
        <div className="flex w-full justify-end space-x-3 border-t border-scale-500 px-3 py-4">
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            htmlType="button"
            disabled={isUpdating}
            loading={isUpdating}
            onClick={() => submitRef?.current?.click()}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div className="py-6">
        <SidePanel.Content>
          <Form
            validateOnBlur
            id={formId}
            initialValues={initialValues}
            validate={validate}
            onSubmit={onConfirmUpdate}
          >
            {() => {
              return (
                <div className="space-y-6">
                  <Input id="branchName" label="Branch name" />
                  <Input disabled id="gitBranch" label="Git branch" />
                  <button ref={submitRef} type="submit" className="hidden" />
                </div>
              )
            }}
          </Form>
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default UpdateBranchSidePanel
