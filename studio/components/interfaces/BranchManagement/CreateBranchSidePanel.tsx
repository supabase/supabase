import { useRef, useState } from 'react'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Form,
  IconCheck,
  IconCode,
  Listbox,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  SidePanel,
} from 'ui'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject, useStore } from 'hooks'

interface CreateBranchSidePanelProps {
  visible: boolean
  onClose: () => void
}

// [Joshen] Optimization: Remove Form component, just use Combobox

const CreateBranchSidePanel = ({ visible, onClose }: CreateBranchSidePanelProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const submitRef: any = useRef()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const [open, setOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('---')

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const formId = 'create-branch-form'
  const initialValues = { gitBranch: 'no-selection' }

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.connections.some((connection) => connection.supabase_project_ref === projectRef)
  )
  const repositoryMeta = githubIntegration?.connections?.[0]
  const [repoOwner, repoName] = repositoryMeta?.metadata.name.split('/') || []
  const {
    data: githubBranches,
    error: githubBranchesError,
    isLoading: isLoadingBranches,
    isSuccess: isSuccessBranches,
    isError: isErrorBranches,
  } = useGithubBranchesQuery({
    organizationIntegrationId: githubIntegration?.id,
    repoOwner,
    repoName,
  })

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: `Successfully created new branch` })
      onClose()
    },
  })

  const validate = (values: any) => {
    const errors: any = {}
    if (values.gitBranch.length === 0 || values.gitBranch === 'no-selection')
      errors.gitBranch = 'Please select a Git branch to link to this preview branch'
    return errors
  }

  const onConfirmCreate = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({ projectRef, ...values, branchName: values.gitBranch })
  }

  return (
    <SidePanel
      visible={visible}
      loading={isCreating}
      onCancel={onClose}
      onConfirm={() => {}}
      header="Create a new database preview branch"
    >
      <div className="py-6">
        <SidePanel.Content>
          {(isLoadingIntegrations || isLoadingBranches) && (
            <div>
              <p className="text-sm prose mb-2">
                Select a Git branch to create a database preview from
              </p>
              <ShimmeringLoader className="py-4" />
            </div>
          )}
          {(isErrorIntegrations || isErrorBranches) && (
            <AlertError
              error={integrationsError || githubBranchesError}
              subject="Failed to retrieve Github branches"
            />
          )}
          {isSuccessIntegrations && isSuccessBranches && (
            <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
              <PopoverTrigger_Shadcn_ asChild>
                <div className="space-y-2">
                  <p className="text-sm prose mb-2">
                    Select a Git branch to create a database preview from
                  </p>
                  <div className="bg-surface-200 border border-scale-700 w-full py-2 rounded-md h-[38px] flex items-center justify-between px-4">
                    <p className="text-sm">{selectedBranch}</p>
                    <IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} />
                  </div>
                </div>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Find branch..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      {githubBranches?.map((branch) => {
                        return (
                          <CommandItem_Shadcn_
                            asChild
                            key={branch.name}
                            value={branch.name}
                            className="cursor-pointer w-full flex items-center justify-between"
                            onSelect={() => {
                              setSelectedBranch(branch.name)
                              setOpen(false)
                            }}
                            onClick={() => {
                              setSelectedBranch(branch.name)
                              setOpen(false)
                            }}
                          >
                            <div className="w-full flex items-center justify-between">
                              {branch.name}
                              {branch.name === selectedBranch && <IconCheck />}
                            </div>
                          </CommandItem_Shadcn_>
                        )
                      })}
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
        </SidePanel.Content>
      </div>
    </SidePanel>
  )

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
                  {(isLoadingIntegrations || isLoadingBranches) && (
                    <div>
                      <p className="text-sm prose mb-2">
                        Select a Git branch to create a database preview from
                      </p>
                      <ShimmeringLoader className="py-4" />
                    </div>
                  )}
                  {(isErrorIntegrations || isErrorBranches) && (
                    <AlertError
                      error={integrationsError || githubBranchesError}
                      subject="Failed to retrieve Github branches"
                    />
                  )}
                  {isSuccessIntegrations && isSuccessBranches && (
                    <Listbox
                      size="medium"
                      id="gitBranch"
                      name="gitBranch"
                      label="Select a Git branch to create a database preview from"
                    >
                      <Listbox.Option
                        label="---"
                        key="no-selection"
                        id="no-selection"
                        value="no-selection"
                      >
                        ---
                      </Listbox.Option>
                      {githubBranches?.map((branch) => (
                        <Listbox.Option
                          key={branch.name}
                          id={branch.name}
                          value={branch.name}
                          label={branch.name}
                        >
                          <p className="text-scale-1200">{branch.name}</p>
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  )}
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
