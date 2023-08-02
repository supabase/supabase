import { useRef } from 'react'
import { Button, Form, Input, Listbox, SidePanel } from 'ui'

import { useParams } from 'common'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useSelectedProject, useStore } from 'hooks'

interface CreateBranchSidePanelProps {
  visible: boolean
  onClose: () => void
}

const MOCK_BRANCHES = [
  { id: 1, name: 'feat/branch-01' },
  { id: 2, name: 'feat/branch-02' },
]

const CreateBranchSidePanel = ({ visible, onClose }: CreateBranchSidePanelProps) => {
  const { ui } = useStore()
  const submitRef: any = useRef()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const formId = 'create-branch-form'
  const initialValues = { branchName: '', gitBranch: 'no-selection' }
  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: `Successfully created new branch` })
      onClose()
    },
  })

  const validate = (values: any) => {
    const errors: any = {}
    if (values.branchName.length === 0)
      errors.branchName = 'Please provide a name for your preview branch'
    if (values.gitBranch.length === 0 || values.gitBranch === 'no-selection')
      errors.gitBranch = 'Please select a Git branch to link to this database preview branch'
    return errors
  }

  const onConfirmCreate = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({ projectRef, ...values })
  }

  return (
    <SidePanel
      visible={visible}
      loading={isCreating}
      onCancel={onClose}
      header="Create a new database preview branch"
      customFooter={
        <div className="flex w-full justify-end space-x-3 border-t border-scale-500 px-3 py-4">
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            htmlType="button"
            disabled={isCreating}
            loading={isCreating}
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
            onSubmit={onConfirmCreate}
          >
            {() => {
              return (
                <div className="space-y-6">
                  <Input id="branchName" label="Branch name" />
                  <Listbox size="medium" id="gitBranch" name="gitBranch" label="Git branch">
                    <Listbox.Option
                      label="---"
                      key="no-selection"
                      id="no-selection"
                      value="no-selection"
                    >
                      ---
                    </Listbox.Option>
                    {MOCK_BRANCHES.map((branch) => (
                      <Listbox.Option
                        key={branch.id}
                        id={branch.id.toString()}
                        value={branch.name}
                        label={branch.name}
                      >
                        <p className="text-scale-1200">{branch.name}</p>
                      </Listbox.Option>
                    ))}
                  </Listbox>

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

export default CreateBranchSidePanel
