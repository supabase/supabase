import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'

import ProjectLinker from 'components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useGitHubRepositoriesQuery } from 'data/integrations/github-repositories-query'
import type { IntegrationConnectionsCreateVariables } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Button, Card, CardContent, cn, SheetDescription, SheetFooter } from 'ui'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import {
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_ as Label,
  Switch,
} from 'ui'
import { Github, Loader2, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-6">
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

export type SidePanelGitHubRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitHubRepoLinker = ({ projectRef }: SidePanelGitHubRepoLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()
  const selectedProject = useSelectedProject()

  const visible = sidePanelStateSnapshot.githubConnectionsOpen

  const { data: gitHubAuthorization, isLoading: isLoadingGitHubAuthorization } =
    useGitHubAuthorizationQuery({ enabled: visible })

  // [Alaister]: temp override with <any> until the typegen is fixed
  const { data: githubReposData, isLoading: isLoadingGitHubRepos } = useGitHubRepositoriesQuery<
    any[]
  >({
    enabled: visible && Boolean(gitHubAuthorization),
  })

  /**
   * Supabase projects available
   */
  const { data: supabaseProjectsData, isLoading: isLoadingSupabaseProjects } = useProjectsQuery({
    enabled: visible,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrganization?.id)
        .map((project) => ({ name: project.name, ref: project.ref })) ?? EMPTY_ARR,
    [selectedOrganization?.id, supabaseProjectsData]
  )

  const githubRepos = useMemo(
    () =>
      githubReposData?.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        installation_id: repo.installation_id,
      })) ?? EMPTY_ARR,
    [githubReposData]
  )

  // derived connection & repo values from queries
  // existingConnection comes from the connections query (see below)
  // selectedRepo is derived from the repo list using existingConnection
  const [isGitBranchValid, setIsGitBranchValid] = useState<boolean>(true)

  const { data: connections } = useGitHubConnectionsQuery(
    {
      organizationId: selectedOrganization?.id,
    },
    {
      enabled: !!projectRef && visible,
    }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  // selectedRepo is calculated on-the-fly from the latest data
  const selectedRepo = useMemo(() => {
    if (!existingConnection) return undefined
    return (githubReposData as any[])?.find(
      (r) => r.id?.toString() === existingConnection.repository.id?.toString()
    )
  }, [existingConnection, githubReposData])

  const { mutate: createBranch } = useBranchCreateMutation()
  const { mutate: updateBranch } = useBranchUpdateMutation()

  const { data: existingBranches } = useBranchesQuery(
    { projectRef },
    { enabled: !!projectRef && visible }
  )

  const isBranchingEnabled = selectedProject?.is_branch_enabled ?? false

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitHubConnectionCreateMutation()

  const { mutateAsync: deleteConnection } = useGitHubConnectionDeleteMutation()

  // Form and config state
  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation({
      onSuccess: () => toast.success('Updated connection settings'),
    })

  const FormSchema = z
    .object({
      autoBranchingEnabled: z.boolean().default(false),
      branchName: z.string(),
      supabaseDirectory: z.string().default(''),
      supabaseChangesOnly: z.boolean().default(false),
      branchLimit: z.string().default('50'),
    })
    .superRefine(async (val, ctx) => {
      if (val.autoBranchingEnabled) {
        if (val.branchName.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Branch name cannot be empty',
            path: ['branchName'],
          })
          return
        }

        if (existingConnection?.id && val.branchName && val.branchName.length > 0) {
          try {
            await checkGithubBranchValidity({
              connectionId: Number(existingConnection.id),
              branchName: val.branchName,
            })
            setIsGitBranchValid(true)
          } catch (error) {
            setIsGitBranchValid(false)
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Branch "${val.branchName}" not found in repository`,
              path: ['branchName'],
            })
          }
        } else {
          setIsGitBranchValid(true)
        }
      } else {
        setIsGitBranchValid(true)
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      autoBranchingEnabled: false,
      branchName: selectedRepo?.default_branch ?? 'main',
      supabaseDirectory: '',
      supabaseChangesOnly: false,
      branchLimit: '50',
    },
  })

  const autoBranchingEnabled = form.watch('autoBranchingEnabled')

  const prodBranch = existingBranches?.find((b: any) => b.is_default)
  const currentGitBranch = prodBranch?.git_branch
  const isCurrentlyEnabled = prodBranch
    ? Boolean(currentGitBranch && currentGitBranch.trim().length > 0)
    : false

  const formDisabled = !(existingConnection && selectedRepo && autoBranchingEnabled)

  // Reset form whenever the repo / connection / branches change
  useEffect(() => {
    if (visible) {
      const isAutoBranchingEnabled = prodBranch
        ? Boolean(prodBranch.git_branch && prodBranch.git_branch.trim().length > 0)
        : false

      if (selectedRepo) {
        const defaults = {
          autoBranchingEnabled: isAutoBranchingEnabled,
          branchName: prodBranch?.git_branch ?? selectedRepo.default_branch ?? 'main',
          supabaseDirectory:
            (existingConnection as any)?.workdir ??
            (existingConnection as any)?.metadata?.supabaseConfig?.supabaseDirectory ??
            '',
          supabaseChangesOnly: false,
          branchLimit: String(
            ((existingConnection as any)?.branch_limit as number | undefined) ??
              (existingConnection as any)?.metadata?.supabaseConfig?.branchLimit ??
              50
          ),
        }

        form.reset(defaults)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo?.id, existingConnection?.id, existingBranches, visible, prodBranch])

  // This saves connection settings and creates/updates branches which also enables branching if it's not already enabled
  const handleSave = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref missing')
    if (!selectedRepo) return console.error('Repo not selected')
    if (!existingConnection) return console.error('Connection missing')

    const defaultBranch = data.branchName

    if (data.autoBranchingEnabled) {
      if (!isBranchingEnabled) {
        // create production branch (enables branching)
        createBranch({
          projectRef,
          branchName: defaultBranch,
          gitBranch: defaultBranch,
        })
      } else {
        if (prodBranch?.id) {
          updateBranch({
            id: prodBranch.id,
            projectRef,
            branchName: defaultBranch,
            gitBranch: defaultBranch,
          })
        }
      }
    } else if (isBranchingEnabled) {
      if (prodBranch?.id) {
        updateBranch({
          id: prodBranch.id,
          projectRef,
          branchName: prodBranch.name ?? 'main',
          gitBranch: '',
        })
      }
    }

    if (selectedOrganization?.id) {
      updateConnectionSettings({
        connectionId: existingConnection.id,
        organizationId: selectedOrganization.id,
        workdir: data.supabaseDirectory,
        supabaseChangesOnly: data.supabaseChangesOnly,
        branchLimit: Number(data.branchLimit),
      })
    }

    sidePanelStateSnapshot.setGithubConnectionsOpen(false)
  }

  const createGithubConnection = async (variables: IntegrationConnectionsCreateVariables) => {
    if (!selectedOrganization?.id) {
      throw new Error('No organization id')
    }
    if (!variables.new) {
      throw new Error('No new connection')
    }

    if (existingConnection) {
      // remove existing connection so we can recreate it or update it
      try {
        await deleteConnection({
          organizationId: selectedOrganization.id,
          connectionId: existingConnection.id,
        })
      } catch (_) {
        /* handled in mutation */
      }
    }

    createConnection({
      organizationId: selectedOrganization.id,
      connection: variables.new,
    })
  }

  let submitButtonText = 'Save'

  if (isCurrentlyEnabled !== autoBranchingEnabled) {
    submitButtonText = autoBranchingEnabled ? 'Save and enable' : 'Save and disable'
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) sidePanelStateSnapshot.setGithubConnectionsOpen(false)
      }}
    >
      <SheetContent size="lg" side="right" showClose>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <SheetHeader>
              <SheetTitle>Automatic Branching</SheetTitle>
              <SheetDescription>
                Automatically create, sync, and merge branches in Supabase when you make changes to
                your GitHub repository.
              </SheetDescription>
            </SheetHeader>
            <SheetSection className="py-8">
              {/* Connected repo section */}
              <Label className="block mb-4">Connected Repo</Label>

              {/* GitHub authorization prompt if needed */}
              {gitHubAuthorization === null ? (
                <div className="flex flex-col items-center justify-center relative border rounded-lg p-12 bg shadow px-20s">
                  <p className="text-sm text-center">
                    Connect your Supabase projects with your GitHub repositories
                  </p>
                  <p className="text-sm text-center text-foreground-light">
                    Authorize with GitHub to retrieve your GitHub repositories
                  </p>
                  <Button
                    className="w-min mt-3"
                    onClick={() => {
                      openInstallGitHubIntegrationWindow('authorize')
                    }}
                  >
                    Authorize GitHub
                  </Button>
                </div>
              ) : existingConnection ? (
                <Card>
                  <CardContent className="flex items-center gap-2 text-sm">
                    <div className="flex flex-1 items-center gap-2">
                      <Github size={16} className="text-foreground-light" />
                      <span>{existingConnection.repository.name}</span>
                    </div>
                    <Button
                      type="default"
                      loading={isCreatingConnection}
                      onClick={async () => {
                        if (!selectedOrganization?.id || !existingConnection || !projectRef) return
                        try {
                          await deleteConnection({
                            organizationId: selectedOrganization.id,
                            connectionId: existingConnection.id,
                          })
                          if (prodBranch?.id && isCurrentlyEnabled) {
                            updateBranch({
                              id: prodBranch.id,
                              projectRef,
                              branchName: prodBranch.name ?? 'main',
                              gitBranch: '',
                            })
                          }
                        } catch (_) {
                          /* handled in mutation */
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ProjectLinker
                  defaultSupabaseProjectRef={projectRef}
                  foreignProjects={githubRepos}
                  supabaseProjects={supabaseProjects}
                  onCreateConnections={createGithubConnection}
                  isLoading={isCreatingConnection}
                  loadingForeignProjects={isLoadingGitHubRepos}
                  loadingSupabaseProjects={isLoadingSupabaseProjects}
                  integrationIcon={GITHUB_ICON}
                  choosePrompt="Choose GitHub Repo"
                  showNoEntitiesState={false}
                  mode="GitHub"
                />
              )}

              <div className="mt-4">
                {/* Global enable toggle which just sets the git branch to empty string if disabled */}
                <FormField_Shadcn_
                  control={form.control}
                  name="autoBranchingEnabled"
                  render={({ field }) => (
                    <FormItemLayout
                      className={cn(
                        'mb-4',
                        !existingConnection && 'opacity-25 pointer-events-none'
                      )}
                      layout="flex-row-reverse"
                      label="Enable automatic branching"
                      description="Automatically create and merge preview branches from Pull Requests."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!existingConnection}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {/* Branch / connection settings form */}
                <div
                  className={cn(
                    'flex flex-col gap-4',
                    formDisabled && 'opacity-25 pointer-events-none'
                  )}
                >
                  <FormField_Shadcn_
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Production branch name"
                        description="Migrations will be applied to this branch on every commit"
                      >
                        <div className="relative w-full">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              autoComplete="off"
                              disabled={formDisabled || !autoBranchingEnabled}
                            />
                          </FormControl_Shadcn_>
                          <div className="absolute top-2.5 right-3 flex items-center gap-2">
                            {isCheckingBranch && <Loader2 size={14} className="animate-spin" />}
                            {field.value &&
                              !isCheckingBranch &&
                              isGitBranchValid &&
                              autoBranchingEnabled && (
                                <Check size={14} className="text-brand" strokeWidth={2} />
                              )}
                          </div>
                        </div>
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
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
                            disabled={formDisabled}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
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
                            disabled={formDisabled}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
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
                            disabled={formDisabled}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </div>
            </SheetSection>
            <SheetFooter className="flex justify-end gap-2">
              <Button
                type="default"
                size="small"
                onClick={() => sidePanelStateSnapshot.setGithubConnectionsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                htmlType="submit"
                loading={isUpdatingConnection}
                disabled={isUpdatingConnection || isCreatingConnection || isCheckingBranch}
              >
                {submitButtonText}
              </Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}

export default SidePanelGitHubRepoLinker
