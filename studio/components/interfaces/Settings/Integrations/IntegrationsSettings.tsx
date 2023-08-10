import { zodResolver } from '@hookform/resolvers/zod'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGithubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutate'
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import {
  Integration,
  IntegrationName,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useVercelConnectionUpdateMutation } from 'data/integrations/vercel-connection-update-mutate'
import { useFlag, useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { GitBranch, RotateCcw, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconExternalLink,
  Input_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Switch,
  cn,
} from 'ui'
import * as z from 'zod'
import { IntegrationConnectionItem } from '../../Integrations/IntegrationConnection'
import SidePanelGitHubRepoLinker from './../../Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from './../../Organization/IntegrationSettings/SidePanelVercelProjectLinker'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const IntegrationSettings = () => {
  const org = useSelectedOrganization()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const projectContext = useProjectContext()

  const vercelIntegrations = useMemo(() => {
    return data
      ?.filter((integration) => integration.integration.name === 'Vercel')
      .map((integration) => {
        if (integration.metadata && integration.integration.name === 'Vercel') {
          const avatarSrc =
            !integration.metadata.account.avatar && integration.metadata.account.type === 'Team'
              ? `https://vercel.com/api/www/avatar?teamId=${integration.metadata.account.team_id}&s=48`
              : `https://vercel.com/api/www/avatar/${integration.metadata.account.avatar}?s=48`

          integration['metadata']['account']['avatar'] = avatarSrc
        }

        return integration
      })
  }, [data])

  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
  )

  // We're only supporting one Vercel integration per org for now
  // this will need to be updated when we support multiple integrations
  const vercelIntegration = vercelIntegrations?.[0]
  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: vercelIntegration?.id,
    },
    { enabled: vercelIntegration?.id !== undefined }
  )
  const vercelProjectCount = vercelProjectsData?.length ?? 0

  const onAddVercelConnection = useCallback(
    (integrationId: string) => {
      sidePanelsStateSnapshot.setVercelConnectionsIntegrationId(integrationId)
      sidePanelsStateSnapshot.setVercelConnectionsOpen(true)
    },
    [sidePanelsStateSnapshot]
  )

  const onAddGitHubConnection = useCallback(
    (integrationId: string) => {
      sidePanelsStateSnapshot.setGithubConnectionsIntegrationId(integrationId)
      sidePanelsStateSnapshot.setGithubConnectionsOpen(true)
    },
    [sidePanelsStateSnapshot]
  )

  const { mutateAsync: deleteVercelConnection } =
    useIntegrationsVercelInstalledConnectionDeleteMutation()

  const onDeleteVercelConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      await deleteVercelConnection({
        id: connection.id,
        organization_integration_id: connection.organization_integration_id,
        orgSlug: org?.slug,
      })
    },
    [deleteVercelConnection, org?.slug]
  )

  const { mutateAsync: deleteGitHubConnection } =
    useIntegrationsGitHubInstalledConnectionDeleteMutation()

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      await deleteGitHubConnection({
        connectionId: connection.id,
        integrationId: connection.organization_integration_id,
        orgSlug: org?.slug,
      })
    },
    [deleteGitHubConnection, org?.slug]
  )

  /**
   * Vercel markdown content
   */

  const VercelTitle = `Vercel Integration`

  const VercelDetailsSection = `

Connect your Vercel teams to your Supabase organization.
`

  const VercelContentSectionTop = `

### How does the Vercel integration work?

Supabase will keep your environment variables up to date in each of the projects you assign to a Supabase project.
You can also link multiple Vercel Projects to the same Supabase project.
`

  const VercelContentSectionBottom =
    vercelProjectCount > 0 && vercelIntegration !== undefined
      ? `
Your Vercel connection has access to ${vercelProjectCount} Vercel Projects.
You can change the scope of the access for Supabase by configuring
[here](${getIntegrationConfigurationUrl(vercelIntegration)}).
`
      : ''

  const VercelSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={VercelTitle}>
          <Markdown content={VercelDetailsSection} />
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={VercelContentSectionTop} />
          {vercelIntegrations && vercelIntegrations.length > 0 ? (
            vercelIntegrations
              .filter((x) =>
                x.connections.find((x) => x.supabase_project_ref === projectContext.project?.ref)
              )
              .map((integration, i) => {
                return (
                  <div key={integration.id}>
                    <IntegrationInstallation title={'Vercel'} integration={integration} />
                    {integration.connections.length > 0 ? (
                      <>
                        <IntegrationConnectionHeader />
                        <ul className="flex flex-col">
                          {integration.connections.map((connection) => (
                            <div
                              key={connection.id}
                              className="relative flex flex-col -gap-[1px] [&>li]:pb-0"
                            >
                              <IntegrationConnectionItem
                                connection={connection}
                                type={'Vercel' as IntegrationName}
                                onDeleteConnection={onDeleteVercelConnection}
                                className="!rounded-b-none !mb-0"
                              />
                              <div className="relative pl-8 ml-6 border-l border-scale-600 dark:border-scale-400 pb-6">
                                <div className="border-b border-l border-r rounded-b-lg">
                                  <VercelIntegrationConnectionForm
                                    connection={connection}
                                    integration={integration}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <IntegrationConnectionHeader
                        markdown={`### ${integration.connections.length} project ${pluralize(
                          integration.connections.length,
                          'connection'
                        )} Repository connections for Vercel`}
                      />
                    )}
                    <EmptyIntegrationConnection
                      onClick={() => onAddVercelConnection(integration.id)}
                    >
                      Add new project connection
                    </EmptyIntegrationConnection>
                  </div>
                )
              })
          ) : (
            <div>
              <Link href="https://vercel.com/integrations/supabase-v2" passHref>
                <Button type="default" iconRight={<IconExternalLink />} asChild>
                  <a target="_blank">Install Vercel Integration</a>
                </Button>
              </Link>
            </div>
          )}
          {VercelContentSectionBottom && (
            <Markdown content={VercelContentSectionBottom} className="text-lighter" />
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )

  const VercelIntegrationConnectionForm = ({
    connection,
    integration,
  }: {
    connection: IntegrationProjectConnection
    integration: Integration
  }) => {
    const enableVercelConnectionsConfig = useFlag('enableVercelConnectionsConfig')

    const { ui } = useStore()
    const config = connection.metadata.supabaseConfig

    const FormSchema = z.object({
      environmentVariablesProduction: z
        .boolean()
        .default(config?.environmentVariables?.production ?? true),
      authRedirectUrisProduction: z.boolean().default(config?.authRedirectUris?.production ?? true),
      environmentVariablesPreview: z
        .boolean()
        .default(config?.environmentVariables?.preview ?? true),
      authRedirectUrisPreview: z.boolean().default(config?.authRedirectUris?.preview ?? true),
    })

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        environmentVariablesProduction: config?.environmentVariables?.production ?? true,
        environmentVariablesPreview: config?.environmentVariables?.preview ?? true,
        authRedirectUrisProduction: config?.authRedirectUris?.production ?? true,
        authRedirectUrisPreview: config?.authRedirectUris?.preview ?? true,
      },
    })

    const { mutate: updateVercelConnection, isLoading: isUpdatingVercelConnection } =
      useVercelConnectionUpdateMutation({
        onSuccess: (data) => {
          ui.setNotification({
            category: 'success',
            message: `Updated Supabase directory`,
          })
        },
      })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      /**
       * remove this hardcoded if statement when we are ready to enable this feature
       */
      if (!enableVercelConnectionsConfig) return

      const metadata = {
        ...connection.metadata,
      }

      metadata.supabaseConfig = {
        environmentVariables: {
          production: data.environmentVariablesProduction,
          preview: data.environmentVariablesPreview,
        },
        authRedirectUris: {
          production: data.authRedirectUrisProduction,
          preview: data.authRedirectUrisPreview,
        },
      }

      updateVercelConnection({
        id: connection.id,
        metadata,
        organizationIntegrationId: integration.id,
      })
    }

    return (
      <Form_Shadcn_ {...form}>
        <div className="py-4 px-8">
          <Alert_Shadcn_ variant="default" className="">
            <IconClock className="h-4 w-4" strokeWidth={2} />
            <AlertTitle_Shadcn_>Vercel Connection configuration coming soon</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              This configuration will allow you to control the environment variables and auth
              redirects for production and preview deployments.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
        <ScaffoldDivider />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(!enableVercelConnectionsConfig && 'opacity-30', 'w-full space-y-6')}
        >
          <div>
            {/* {isUpdatingVercelConnection && 'isUpdatingVercelConnection'} */}
            <div className="flex flex-col gap-6 px-8 py-8">
              <h5 className="text text-sm">Vercel Production deployments </h5>
              <FormField_Shadcn_
                control={form.control}
                name="environmentVariablesProduction"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Sync environment variables for Vercel Production deployments
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs text-lighter">
                        Deploy Edge Functions when merged into Production Branch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch
                        disabled={!enableVercelConnectionsConfig}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e)
                          form.handleSubmit(onSubmit)()
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
              {/* <Button htmlType="submit">Submit</Button> */}
              <FormField_Shadcn_
                control={form.control}
                name="authRedirectUrisProduction"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Auto update Auth Redirect URIs for Vercel Production Deployments
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs text-lighter">
                        Deploy Edge Functions when merged into Production Branch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch
                        disabled={!enableVercelConnectionsConfig}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e)
                          form.handleSubmit(onSubmit)()
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            </div>
            <ScaffoldDivider />
            <div className="flex flex-col gap-6 px-8 py-8">
              <h5 className="text text-sm">Vercel Preview deployments </h5>
              <FormField_Shadcn_
                control={form.control}
                name="environmentVariablesPreview"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Sync environment variables for Vercel Preview Deployments
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs text-lighter">
                        Preview deployments will be able to connect to Supabase Database Preview
                        branches
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch
                        disabled={!enableVercelConnectionsConfig}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e)
                          form.handleSubmit(onSubmit)()
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="authRedirectUrisPreview"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Auto update Auth Redirect URIs for Vercel Preview Deployments
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs text-lighter">
                        Deploy Edge Functions when merged into Production Branch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch
                        disabled={!enableVercelConnectionsConfig}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e)
                          form.handleSubmit(onSubmit)()
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            </div>
          </div>
          {/* <Button htmlType="submit">Submit</Button> */}
        </form>
      </Form_Shadcn_>
    )
  }

  /**
   * GitHub markdown content
   */

  const GitHubTitle = `GitHub Connections`

  const GitHubDetailsSection = `
Connect any of your GitHub repositories to a project.
`

  const GitHubContentSectionTop = `

### How will GitHub connections work?

You will be able to connect a GitHub repository to a Supabase project.
The GitHub app will watch for changes in your repository such as file changes, branch changes as well as pull request activity.

These connections will be part of a GitHub workflow that is currently in development.
`

  const GitHubSection = () => (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <Markdown content={GitHubDetailsSection} />
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <Markdown content={GitHubContentSectionTop} />
          {githubIntegrations &&
            githubIntegrations.length > 0 &&
            githubIntegrations.map((integration, i) => {
              const ConnectionHeaderTitle = `${integration.connections.length} project ${pluralize(
                integration.connections.length,
                'connection'
              )} `

              return (
                <div key={integration.id}>
                  <IntegrationInstallation title={'GitHub'} integration={integration} />
                  {integration.connections.length > 0 ? (
                    <>
                      <IntegrationConnectionHeader
                      // title={ConnectionHeaderTitle}
                      // markdown={`Repository connections for GitHub`}
                      />
                      <ul className="flex flex-col">
                        {integration.connections.map((connection) => (
                          <div
                            key={connection.id}
                            className="relative flex flex-col -gap-[1px] [&>li]:pb-0"
                          >
                            <IntegrationConnectionItem
                              showNode={false}
                              key={connection.id}
                              connection={connection}
                              type={'GitHub' as IntegrationName}
                              onDeleteConnection={onDeleteGitHubConnection}
                              className="!rounded-b-none !mb-0"
                            />

                            <div className="border-b border-l border-r rounded-b-lg">
                              <GitHubIntegrationConnectionForm
                                connection={connection}
                                integration={integration}
                              />
                            </div>
                          </div>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <IntegrationConnectionHeader
                      markdown={`### ${integration.connections.length} project ${pluralize(
                        integration.connections.length,
                        'connection'
                      )} Repository connections for GitHub`}
                    />
                  )}
                </div>
              )
            })}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )

  const GitHubIntegrationConnectionForm = ({
    connection,
    integration,
  }: {
    connection: IntegrationProjectConnection
    integration: Integration
  }) => {
    const [open, setOpen] = useState(false)
    const comboBoxRef = useRef<HTMLButtonElement>(null)
    const projectContext = useProjectContext()

    const githubProjectIntegration = integration?.connections.find(
      (connection) => connection.supabase_project_ref === projectContext.project?.ref
    )

    const [repoOwner, repoName] = githubProjectIntegration?.metadata.name.split('/') ?? []

    const { ui } = useStore()

    const {
      data: githubBranches,
      error: githubBranchesError,
      isLoading: isLoadingBranches,
      isSuccess: isSuccessBranches,
    } = useGithubBranchesQuery({
      organizationIntegrationId: integration?.id,
      repoOwner,
      repoName,
    })

    const { mutate: updateBranch, isLoading: isUpdatingProdBranch } = useBranchUpdateMutation({
      onSuccess: (data) => {
        ui.setNotification({
          category: 'success',
          message: `Changed Production Branch to ${data.git_branch}`,
        })
        setOpen(false)
      },
    })

    const { data: previewBranches, isLoading: isLoadingPreviewBranches } = useBranchesQuery(
      {
        projectRef: projectContext.project?.ref,
      },
      {
        enabled: projectContext !== undefined,
      }
    )

    const productionPreviewBranch = previewBranches?.find((branch) => branch.is_default)

    function onUpdateProductionBranch(branchName: string) {
      if (!projectContext.project?.ref) return
      if (!productionPreviewBranch) return
      updateBranch({
        id: productionPreviewBranch.id,
        projectRef: projectContext.project.ref,
        branchName: branchName,
        gitBranch: branchName,
      })
    }

    const FormSchema = z.object({
      supabaseDirectory: z
        .string()
        .default(connection.metadata?.supabaseConfig?.supabaseDirectory ?? ''),
    })
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        supabaseDirectory: connection?.metadata?.supabaseConfig?.supabaseDirectory,
      },
    })


    const { mutate: updateGithubConnection, isLoading: isUpdatingGithubConnection } =
      useGithubConnectionUpdateMutation({
        onSuccess: (data) => {
          ui.setNotification({
            category: 'success',
            message: `Updated Supabase directory`,
          })
          setOpen(false)
        },
      })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      const metadata = {
        ...connection.metadata,
        supabaseConfig: {
          ...connection.metadata?.supabaseConfig,
          supabaseDirectory: data.supabaseDirectory,
        },
      }

      updateGithubConnection({
        id: connection.id,
        metadata,
        organizationIntegrationId: integration.id,
      })
    }

    return (
      <div className="flex flex-col gap-6 px-8 py-8">
        <div>
          <Label_Shadcn_ className="text">Production branch</Label_Shadcn_>
          <p className="text-xs text-light mb-3">
            Deploy Edge Functions when merged into Production branch
          </p>
          {/* <pre>! This should only work if branching is turned on !</pre> */}
          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild name="branch-selector">
              <Button
                disabled={isUpdatingProdBranch}
                type="default"
                size="medium"
                ref={comboBoxRef}
                className={cn(
                  'justify-start w-64',
                  productionPreviewBranch?.git_branch === undefined ? 'text-light' : 'text'
                )}
                icon={
                  productionPreviewBranch?.git_branch && (
                    <Shield className="w-4 h-4 text-warning" strokeWidth={1} />
                  )
                }
                loading={isUpdatingProdBranch || isLoadingBranches}
                iconRight={
                  <span className="grow flex justify-end">
                    <IconChevronDown className={''} />
                  </span>
                }
              >
                {productionPreviewBranch?.git_branch || 'Select a branch'}
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="p-0"
              side="bottom"
              align="start"
              style={{ width: comboBoxRef.current?.offsetWidth }}
            >
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find branch..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {githubBranches?.map((branch) => {
                      const active = branch.name === productionPreviewBranch?.git_branch
                      return (
                        <CommandItem_Shadcn_
                          key={branch.name}
                          value={branch.name}
                          className="cursor-pointer w-full flex items-center justify-between"
                          onSelect={() => {
                            setOpen(false)
                            onUpdateProductionBranch(branch.name)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {active ? (
                              <Shield className="w-4 h-4 text-warning" strokeWidth={1} />
                            ) : (
                              <GitBranch className="w-4 h-4" strokeWidth={1} />
                            )}
                            {branch.name}
                          </div>
                          {branch.name === productionPreviewBranch?.git_branch && <IconCheck />}
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>

        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel_Shadcn_ className="!text">Supabase directory</FormLabel_Shadcn_>
            <FormDescription_Shadcn_ className="text-xs text-lighter mb-3">
              Migrations and seed.sql file will be run from this directory.
            </FormDescription_Shadcn_>
            <FormField_Shadcn_
              control={form.control}
              name="supabaseDirectory"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center gap-3 !space-y-0">
                  <FormControl_Shadcn_ className="xl:w-96">
                    <div className="relative">
                      <Input_Shadcn_
                        {...field}
                        onKeyPress={(event) => {
                          if (event.key === 'Escape') {
                            form.reset()
                          }
                        }}
                      />
                      <RotateCcw
                        className={cn(
                          'text-lighter transition hover:text cursor-pointer',
                          'w-4 h-4 absolute right-3 top-3',
                          'duration-150',
                          isUpdatingGithubConnection ||
                            field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                            ? 'opacity-100 transition'
                            : 'opacity-0'
                        )}
                        onClick={() => form.reset()}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <Button
                    className={cn(
                      'duration-150',
                      isUpdatingGithubConnection ||
                        field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                        ? 'opacity-100 transition'
                        : 'opacity-0'
                    )}
                    htmlType="submit"
                    type="secondary"
                    size="medium"
                    loading={isUpdatingGithubConnection}
                    disabled={isUpdatingGithubConnection}
                  >
                    Update
                  </Button>
                </FormItem_Shadcn_>
              )}
            />
          </form>
        </Form_Shadcn_>
      </div>
    )
  }

  return (
    <>
      <GitHubSection />
      <ScaffoldDivider />
      <VercelSection />
      <SidePanelVercelProjectLinker />
      <SidePanelGitHubRepoLinker />
    </>
  )
}

export default IntegrationSettings
