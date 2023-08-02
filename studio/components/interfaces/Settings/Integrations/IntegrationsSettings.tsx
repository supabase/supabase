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
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import {
  IntegrationName,
  IntegrationProjectConnection,
  Integration,
} from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { getIntegrationConfigurationUrl } from 'lib/integration-utils'
import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import {
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
  Input_Shadcn_,
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
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'

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

  const vercelIntegrations = data
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

Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. 
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
          {vercelIntegrations &&
            vercelIntegrations.length > 0 &&
            vercelIntegrations
              .filter((x) =>
                x.connections.find((x) => x.supabase_project_ref === projectContext.project?.ref)
              )
              .map((integration, i) => {
                const ConnectionHeaderTitle = `${
                  integration.connections.length
                } project ${pluralize(integration.connections.length, 'connection')} `

                return (
                  <div key={integration.id}>
                    <IntegrationInstallation title={'Vercel'} integration={integration} />
                    {integration.connections.length > 0 ? (
                      <>
                        <IntegrationConnectionHeader
                          title={ConnectionHeaderTitle}
                          markdown={`Repository connections for Vercel`}
                        />
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
                              <div className="relative pl-8 ml-6 border-l border-scale-600 dark:border-scale-400 pb-3">
                                <div className="border-b border-l border-r rounded-b-md">
                                  <VercelIntegrationConnectionForm connection={connection} />
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
              })}
          {VercelContentSectionBottom && (
            <Markdown content={VercelContentSectionBottom} className="text-lighter" />
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )

  const VercelIntegrationConnectionForm = ({
    connection,
  }: {
    connection: IntegrationProjectConnection
  }) => {
    const FormSchema = z.object({
      environmentVariablesProduction: z.boolean().default(false),
      environmentVariablesPreview: z.boolean().default(false),
      authRedirectUrisProduction: z.boolean().default(false),
      authRedirectUrisPreview: z.boolean().default(false),
    })

    const config = connection.metadata.supabaseConfig

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        environmentVariablesProduction: config.environmentVariables?.production ?? false,
        environmentVariablesPreview: config.environmentVariables?.preview ?? false,
        authRedirectUrisProduction: config.authRedirectUris?.production ?? false,
        authRedirectUrisPreview: config.authRedirectUris?.preview ?? false,
      },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      // toast({
      //   title: 'You submitted the following values:',
      //   description: (
      //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      //     </pre>
      //   ),
      // })
    }

    return (
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <div>
            <div className="flex flex-col gap-6 px-8 py-8">
              <FormField_Shadcn_
                control={form.control}
                name="environmentVariablesProduction"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Auto sync environment variables for Production
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs">
                        Deploy Edge Functions when merged into Production Beanch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="authRedirectUrisProduction"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Auto manage Supabase Auth redirect URIs
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs">
                        Deploy Edge Functions when merged into Production Beanch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            </div>
            <ScaffoldDivider />
            <div className="flex flex-col gap-6 px-8 py-8">
              <h5 className="text-sm">Database Branching configuration </h5>
              <FormField_Shadcn_
                control={form.control}
                name="environmentVariablesPreview"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                    <div className="">
                      <FormLabel_Shadcn_ className="!text">
                        Auto sync enviroment variables for Database Preview Branches
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs">
                        Deploy Edge Functions when merged into Production Beanch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                        Auto manage Supabase Auth redirect URIs for Preview deployments
                      </FormLabel_Shadcn_>
                      <FormDescription_Shadcn_ className="text-xs">
                        Deploy Edge Functions when merged into Production Beanch
                      </FormDescription_Shadcn_>
                    </div>
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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

                            <div className="border-b border-l border-r">
                              <GitHubIntegrationConnectionForm
                                connection={connection}
                                integration={integration}
                              />
                            </div>
                            {/* <Alert_Shadcn_ className="!border-t-transparent rounded-t-none [&>svg]:left-8 !px-10">
                              <AlertTitle_Shadcn_>
                                Only 1 GitHub connection per project
                              </AlertTitle_Shadcn_>
                              <AlertDescription_Shadcn_>
                                Due to the nature of how GitHub connections work, only 1 connection
                                can be made per project to avoid migration conflicts.
                              </AlertDescription_Shadcn_>
                            </Alert_Shadcn_> */}
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
    const [selectedBranch, setSelectedBranch] = useState<string>()

    const FormSchema = z.object({
      productionBranch: z.boolean().default(false),
      supabaseDirectory: z.boolean().default(false),
    })

    const projectContext = useProjectContext()

    const config = connection.metadata.supabaseConfig ?? {}

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        productionBranch: config.environmentVariables?.production ?? false,
        supabaseDirectory: config.environmentVariables?.preview ?? false,
      },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      // toast({
      //   title: 'You submitted the following values:',
      //   description: (
      //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      //     </pre>
      //   ),
      // })
    }

    const githubProjectIntegration = integration?.connections.find(
      (connection) => connection.supabase_project_ref === projectContext.project?.ref
    )

    const [repoOwner, repoName] = githubProjectIntegration?.metadata.name.split('/') ?? []

    const {
      data: githubBranches,
      error: githubBranchesError,
      isLoading: isLoadingBranches,
      isSuccess: isSuccessBranches,
      isError: isErrorBranches,
    } = useGithubBranchesQuery({
      organizationIntegrationId: integration?.id,
      repoOwner,
      repoName,
    })

    return (
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <div className="flex flex-col gap-6 px-8 py-8">
            <FormField_Shadcn_
              control={form.control}
              name="supabaseDirectory"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col">
                  <>
                    {isSuccessBranches && (
                      <>
                        <FormLabel_Shadcn_ className="!text">Production branch</FormLabel_Shadcn_>
                        <FormDescription_Shadcn_ className="text-xs">
                          Deploy Edge Functions when merged into Production branch
                        </FormDescription_Shadcn_>
                        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
                          <PopoverTrigger_Shadcn_ asChild name="branch-selector">
                            <Button
                              block
                              type="default"
                              size="medium"
                              ref={comboBoxRef}
                              className={cn(
                                'justify-start w-64',
                                selectedBranch === undefined ? 'text-light' : 'text'
                              )}
                              iconRight={
                                <span className="grow flex justify-end">
                                  <IconChevronDown className={''} />
                                </span>
                              }
                            >
                              {selectedBranch || 'Select a branch'}
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
                                  {githubBranches?.map((branch) => (
                                    <CommandItem_Shadcn_
                                      asChild
                                      key={branch.name}
                                      value={branch.name}
                                      className="cursor-pointer w-full flex items-center justify-between"
                                      onSelect={() => {
                                        setOpen(false)
                                        setSelectedBranch(branch.name)
                                      }}
                                      onClick={() => {
                                        setOpen(false)
                                        setSelectedBranch(branch.name)
                                      }}
                                    >
                                      <a>
                                        {branch.name}
                                        {branch.name === selectedBranch && <IconCheck />}
                                      </a>
                                    </CommandItem_Shadcn_>
                                  ))}
                                </CommandGroup_Shadcn_>
                              </CommandList_Shadcn_>
                            </Command_Shadcn_>
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      </>
                    )}
                  </>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="productionBranch"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col">
                  <>
                    <FormLabel_Shadcn_ className="!text">Supabase directory</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs">
                      Deploy Edge Functions when merged into Production branch
                    </FormDescription_Shadcn_>
                    <div className="flex flex-row gap-3">
                      <FormControl_Shadcn_ className="xl:w-96">
                        <Input_Shadcn_ onChange={field.onChange} />
                      </FormControl_Shadcn_>
                      <Button type="default" size={'small'}>
                        Update
                      </Button>
                    </div>
                  </>
                </FormItem_Shadcn_>
              )}
            />
          </div>
        </form>
      </Form_Shadcn_>
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
