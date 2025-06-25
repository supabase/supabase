import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, Github, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import NoPermission from 'components/ui/NoPermission'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-full sm:w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)

  const canReadGitHubConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )
  const canUpdateGitHubConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: selectedOrganization?.id },
    { enabled: !!projectRef && !!selectedOrganization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const { mutate: createBranch } = useBranchCreateMutation()
  const { mutate: updateBranch } = useBranchUpdateMutation()

  const { data: existingBranches } = useBranchesQuery({ projectRef }, { enabled: !!projectRef })

  const isBranchingEnabled = selectedProject?.is_branch_enabled ?? false

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitHubConnectionCreateMutation({})

  const { mutate: deleteConnection } = useGitHubConnectionDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted GitHub connection')
    },
  })

  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

  const prodBranch = existingBranches?.find((b: any) => b.is_default)
  const isConnected = Boolean(existingConnection)

  const GitHubTitle = `GitHub Integration`

  // Production Branch Form
  const ProductionBranchSchema = z
    .object({
      branchName: z.string(),
    })
    .superRefine(async (val, ctx) => {
      if (isConnected && existingConnection && val.branchName && val.branchName.length > 0) {
        try {
          await checkGithubBranchValidity({
            repositoryId: existingConnection.repository.id,
            branchName: val.branchName,
          })
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Branch "${val.branchName}" not found in repository`,
            path: ['branchName'],
          })
        }
      }
    })

  const productionBranchForm = useForm<z.infer<typeof ProductionBranchSchema>>({
    resolver: zodResolver(ProductionBranchSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      branchName: 'main',
    },
  })

  // Automatic Branching Form
  const AutomaticBranchingSchema = z.object({
    autoBranchingEnabled: z.boolean().default(false),
    supabaseDirectory: z.string().default(''),
    supabaseChangesOnly: z.boolean().default(false),
    branchLimit: z.string().default('50'),
  })

  const automaticBranchingForm = useForm<z.infer<typeof AutomaticBranchingSchema>>({
    resolver: zodResolver(AutomaticBranchingSchema),
    defaultValues: {
      autoBranchingEnabled: false,
      supabaseDirectory: '',
      supabaseChangesOnly: false,
      branchLimit: '50',
    },
  })

  const autoBranchingEnabled = automaticBranchingForm.watch('autoBranchingEnabled')

  const onSubmitProductionBranch = async (data: z.infer<typeof ProductionBranchSchema>) => {
    const originalBranchName = prodBranch?.git_branch

    if (originalBranchName && data.branchName !== originalBranchName) {
      setIsConfirmingBranchChange(true)
    } else {
      await executeProductionBranchSave(data)
    }
  }

  const executeProductionBranchSave = async (data: z.infer<typeof ProductionBranchSchema>) => {
    if (!projectRef) return

    if (!isBranchingEnabled) {
      // create production branch (enables branching)
      createBranch({
        projectRef,
        branchName: data.branchName,
        gitBranch: data.branchName,
      })
    } else {
      if (prodBranch?.id) {
        updateBranch({
          id: prodBranch.id,
          projectRef,
          branchName: prodBranch.name,
          gitBranch: data.branchName,
        })
      }
    }

    toast.success('Production branch configuration updated')
    setIsConfirmingBranchChange(false)
  }

  const onConfirmBranchChange = async () => {
    await executeProductionBranchSave(productionBranchForm.getValues())
  }

  const onSubmitAutomaticBranching = async (data: z.infer<typeof AutomaticBranchingSchema>) => {
    if (!projectRef || !selectedOrganization) return console.error('Missing required data')
    if (!existingConnection) return toast.error('Please connect to a repository first.')

    if (data.autoBranchingEnabled) {
      const defaultBranch = productionBranchForm.getValues().branchName

      if (!isBranchingEnabled) {
        // create production branch (enables branching)
        createBranch({
          projectRef,
          branchName: defaultBranch,
          gitBranch: defaultBranch,
        })
      }
    }

    updateConnectionSettings({
      connectionId: existingConnection.id,
      organizationId: selectedOrganization.id,
      workdir: data.supabaseDirectory,
      supabaseChangesOnly: data.supabaseChangesOnly,
      branchLimit: Number(data.branchLimit),
    })

    if (data.autoBranchingEnabled) {
      toast.success('Automatic branching enabled')
    } else {
      toast.success('Automatic branching disabled')
    }
  }

  const openLinkerPanel = () => {
    sidePanelStateSnapshot.setGithubConnectionsOpen(true)
  }

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      if (!selectedOrganization?.id) {
        toast.error('Organization not found')
        return
      }

      deleteConnection({
        connectionId: Number(connection.id),
        organizationId: selectedOrganization.id,
      })
    },
    [deleteConnection, selectedOrganization?.id]
  )

  useEffect(() => {
    if (existingConnection) {
      automaticBranchingForm.reset({
        autoBranchingEnabled: true,
        supabaseDirectory:
          (existingConnection as any)?.workdir ??
          (existingConnection as any)?.metadata?.supabaseConfig?.supabaseDirectory ??
          '',
        supabaseChangesOnly:
          (existingConnection as any)?.supabase_changes_only ??
          (existingConnection as any)?.metadata?.supabaseConfig?.supabaseChangesOnly ??
          false,
        branchLimit: String(
          ((existingConnection as any)?.branch_limit as number | undefined) ??
            (existingConnection as any)?.metadata?.supabaseConfig?.branchLimit ??
            50
        ),
      })
    } else {
      automaticBranchingForm.reset({
        autoBranchingEnabled: false,
        supabaseDirectory: '',
        supabaseChangesOnly: false,
        branchLimit: '50',
      })
    }
  }, [existingConnection, automaticBranchingForm])

  useEffect(() => {
    if (prodBranch?.git_branch) {
      productionBranchForm.reset({
        branchName: prodBranch.git_branch,
      })
    } else {
      productionBranchForm.reset({
        branchName: 'main',
      })
    }
  }, [prodBranch, productionBranchForm])

  if (!canReadGitHubConnection) {
    return (
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail title={GitHubTitle}>
            <p>Connect any of your GitHub repositories to a project.</p>
            <IntegrationImageHandler title="github" />
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <NoPermission resourceText="view this organization's GitHub connections" />
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <p>Connect any of your GitHub repositories to a project.</p>
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <div className="space-y-6">
            {/* Section 1: GitHub Connection */}
            <div>
              <h5 className="text-foreground mb-3 text-sm">GitHub Repository</h5>
              {existingConnection ? (
                <ul className="flex flex-col gap-y-2">
                  <IntegrationConnectionItem
                    key={existingConnection.id}
                    disabled={!canUpdateGitHubConnection}
                    connection={{
                      id: String(existingConnection.id),
                      added_by: {
                        id: String(existingConnection.user?.id),
                        primary_email: existingConnection.user?.primary_email ?? '',
                        username: existingConnection.user?.username ?? '',
                      },
                      foreign_project_id: String(existingConnection.repository.id),
                      supabase_project_ref: existingConnection.project.ref,
                      organization_integration_id: 'unused',
                      inserted_at: existingConnection.inserted_at,
                      updated_at: existingConnection.updated_at,
                      metadata: {
                        name: existingConnection.repository.name,
                      } as any,
                    }}
                    type="GitHub"
                    onDeleteConnection={onDeleteGitHubConnection}
                  />
                </ul>
              ) : (
                <EmptyIntegrationConnection
                  onClick={openLinkerPanel}
                  showNode={false}
                  disabled={!canCreateGitHubConnection}
                >
                  Connect repository
                </EmptyIntegrationConnection>
              )}
            </div>

            {/* Section 2: Production Branch Configuration */}
            <Form_Shadcn_ {...productionBranchForm}>
              <form onSubmit={productionBranchForm.handleSubmit(onSubmitProductionBranch)}>
                <Card className={cn(!isConnected && 'opacity-50')}>
                  <CardContent>
                    <FormField_Shadcn_
                      control={productionBranchForm.control}
                      name="branchName"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Production git branch name"
                          description="Sync a git branch to your production Supabase branch"
                        >
                          <div className="relative w-full">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                autoComplete="off"
                                disabled={!isConnected || !canUpdateGitHubConnection}
                              />
                            </FormControl_Shadcn_>
                            <div className="absolute top-2.5 right-3 flex items-center gap-2">
                              {isCheckingBranch && <Loader2 size={14} className="animate-spin" />}
                              {field.value &&
                                !isCheckingBranch &&
                                !productionBranchForm.formState.errors.branchName &&
                                isConnected && (
                                  <Check size={14} className="text-brand" strokeWidth={2} />
                                )}
                            </div>
                          </div>
                          <FormMessage_Shadcn_ />
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-end space-x-2">
                    {productionBranchForm.formState.isDirty && (
                      <Button
                        type="default"
                        onClick={() => productionBranchForm.reset()}
                        disabled={!isConnected || !canUpdateGitHubConnection}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={
                        !isConnected ||
                        !canUpdateGitHubConnection ||
                        isCheckingBranch ||
                        !productionBranchForm.formState.isDirty
                      }
                      loading={isCheckingBranch}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>

            {/* Section 3: Automatic Branching Configuration */}
            <Form_Shadcn_ {...automaticBranchingForm}>
              <form onSubmit={automaticBranchingForm.handleSubmit(onSubmitAutomaticBranching)}>
                <Card className={cn(!isConnected && 'opacity-50')}>
                  <CardContent className="space-y-4">
                    <FormField_Shadcn_
                      control={automaticBranchingForm.control}
                      name="autoBranchingEnabled"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Enable automatic branching"
                          description="New branches will be created for every GitHub pull request"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!isConnected || !canCreateGitHubConnection}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <div
                      className={cn(
                        'space-y-4',
                        (!autoBranchingEnabled || !isConnected) && 'opacity-25 pointer-events-none'
                      )}
                    >
                      <FormField_Shadcn_
                        control={automaticBranchingForm.control}
                        name="supabaseDirectory"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Supabase directory"
                            description="Relative path to your supabase directory."
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                placeholder="supabase"
                                autoComplete="off"
                                disabled={
                                  !autoBranchingEnabled ||
                                  !isConnected ||
                                  !canUpdateGitHubConnection
                                }
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={automaticBranchingForm.control}
                        name="branchLimit"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Branch limit"
                            description="Maximum preview branches that can be created automatically."
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                type="number"
                                autoComplete="off"
                                disabled={
                                  !autoBranchingEnabled ||
                                  !isConnected ||
                                  !canUpdateGitHubConnection
                                }
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={automaticBranchingForm.control}
                        name="supabaseChangesOnly"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Supabase changes only"
                            description="Only trigger branch creation when files inside the Supabase directory change."
                          >
                            <FormControl_Shadcn_>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(val) => field.onChange(val)}
                                disabled={
                                  !autoBranchingEnabled ||
                                  !isConnected ||
                                  !canUpdateGitHubConnection
                                }
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end space-x-2">
                    {automaticBranchingForm.formState.isDirty && (
                      <Button
                        type="default"
                        onClick={() => automaticBranchingForm.reset()}
                        disabled={!isConnected || !canCreateGitHubConnection}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={
                        !isConnected ||
                        !canCreateGitHubConnection ||
                        isUpdatingConnection ||
                        isCreatingConnection ||
                        !automaticBranchingForm.formState.isDirty
                      }
                      loading={isUpdatingConnection || isCreatingConnection}
                    >
                      {automaticBranchingForm.watch('autoBranchingEnabled') !== isConnected
                        ? automaticBranchingForm.watch('autoBranchingEnabled')
                          ? 'Enable'
                          : 'Disable'
                        : 'Save'}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>
          </div>

          <ConfirmationModal
            variant="warning"
            visible={isConfirmingBranchChange}
            title="Changing production git branch"
            confirmLabel="Confirm"
            size="medium"
            onCancel={() => setIsConfirmingBranchChange(false)}
            onConfirm={onConfirmBranchChange}
            loading={isUpdatingConnection || isCreatingConnection}
          >
            <p className="text-sm text-foreground-light">
              Open pull requests will only update your Supabase project on merge if the git base
              branch matches this new production git branch.
            </p>
          </ConfirmationModal>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
