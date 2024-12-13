import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PGlite } from '@electric-sql/pglite'
import {
  PostgresMetaBase,
  PostgresMetaErr,
  PostgresTable,
  wrapError,
  wrapResult,
} from '@gregnr/postgres-meta/base'
import { useChat } from 'ai/react'
import { components } from 'api-types'
import { useParams } from 'common'
import { debounce, uniqBy } from 'lodash'
import {
  Box,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
  File,
  FileX2,
  KeyRound,
  ListOrdered,
  Settings,
  Square,
  User,
  User2,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStore,
} from 'reactflow'
import 'reactflow/dist/style.css'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
import dagre from '@dagrejs/dagre'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { AdvancedConfiguration } from 'components/interfaces/ProjectCreation/AdvancedConfiguration'
import Design from 'components/interfaces/ProjectCreation/Design'
import {
  PostgresVersionSelector,
  extractPostgresVersionDetails,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { SecurityOptions } from 'components/interfaces/ProjectCreation/SecurityOptions'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useAvailableOrioleImageVersion } from 'data/config/project-creation-postgres-versions-query'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import {
  DbInstanceSize,
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import {
  AWS_REGIONS_DEFAULT,
  BASE_PATH,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  FLY_REGIONS_DEFAULT,
  PROJECT_STATUS,
  PROVIDERS,
} from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import type { CloudProvider } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import {
  AiIconAnimation,
  Badge,
  Button,
  cn,
  CodeBlock,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipProvider_Shadcn_,
  TooltipTrigger_Shadcn_,
  Collapsible_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CollapsibleContent_Shadcn_,
  Loading,
  LoadingLine,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { TableNode } from 'components/interfaces/ProjectCreation/design/TableNode'
import { SchemaFlow } from 'components/interfaces/ProjectCreation/design/SchemaFlow'
import Globe from 'components/ui/Globe'
import AutoTextArea from 'components/to-be-cleaned/forms/AutoTextArea'
import DotGrid from 'components/ui/DotGrid'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'
import { Markdown } from 'components/interfaces/Markdown'
import LoadingState from 'components/layouts/ProjectLayout/LoadingState'
import LogoLoader from '@ui/components/LogoLoader'

type DesiredInstanceSize = components['schemas']['DesiredInstanceSize']

const sizes: DesiredInstanceSize[] = [
  'micro',
  'small',
  'medium',
  'large',
  'xlarge',
  '2xlarge',
  '4xlarge',
  '8xlarge',
  '12xlarge',
  '16xlarge',
]

const FormSchema = z.object({
  organization: z.string({
    required_error: 'Please select an organization',
  }),
  projectName: z
    .string()
    .min(1, 'Please enter a project name.') // Required field check
    .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
    .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
  postgresVersion: z.string({
    required_error: 'Please enter a Postgres version.',
  }),
  dbRegion: z.string({
    required_error: 'Please select a region.',
  }),
  cloudProvider: z.string({
    required_error: 'Please select a cloud provider.',
  }),
  dbPassStrength: z.number(),
  dbPass: z
    .string({
      required_error: 'Please enter a database password.',
    })
    .min(1, 'Password is required.'),
  instanceSize: z.string(),
  dataApi: z.boolean(),
  useApiSchema: z.boolean(),
  postgresVersionSelection: z.string(),
  useOrioleDb: z.boolean(),
})

export type CreateProjectForm = z.infer<typeof FormSchema>

const NODE_SEP = 25
const RANK_SEP = 50

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface MessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLoading?: boolean
}

function Message({ role, content, isLoading }: MessageProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('mb-4 text-sm', isUser ? 'text-foreground' : 'text-foreground-light')}
    >
      <div className="flex gap-4 w-auto overflow-hidden">
        {isUser ? (
          <figure className="w-5 h-5 shrink-0 bg-foreground rounded-full flex items-center justify-center">
            <User size={16} strokeWidth={1.5} className="text-background" />
          </figure>
        ) : (
          <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
        )}

        <ReactMarkdown
          className="space-y-5 flex-1 [&>*>code]:text-xs [&>*>*>code]:text-xs min-w-0 [&_li]:space-y-4"
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }: any) => {
              const code = children[0]
              const language = code.props.className?.replace('language-', '') || 'sql'
              return (
                <div className="w-auto -ml-[36px] overflow-x-hidden">
                  <CodeBlock
                    language={language}
                    value={code.props.children[0]}
                    className={cn(
                      'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
                    )}
                  />
                </div>
              )
            },
            code: ({ children, className }: any) => {
              if (className) return null // handled by pre
              return (
                <code className="text-xs bg-background-surface-200 px-1 py-0.5 rounded">
                  {children}
                </code>
              )
            },
            p: ({ children }: any) => <p className="mb-4">{children}</p>,
            ul: ({ children }: any) => <ul className="flex flex-col gap-y-4">{children}</ul>,
            ol: ({ children }: any) => <ol className="flex flex-col gap-y-4">{children}</ol>,
            li: ({ children }: any) => <li className="[&>pre]:mt-2">{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {isLoading && (
        <div className="flex gap-2 items-center text-foreground-lighter mt-2">
          <div className="animate-pulse">Thinking...</div>
        </div>
      )}
    </motion.div>
  )
}

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

interface UserInfo {
  platform?: string
  userCount?: number
  industry?: string
  region?: string
  scale?: string
}

interface DatabaseConfig {
  region: string
  postgresVersion: string
  computeSize?: string
  storageSize?: number
  highAvailability?: boolean
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .split(/(?=[A-Z])/)
    .join(' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
}

function InfoSection({ title, data }: { title: string; data: Record<string, any> }) {
  return (
    <div className="space-y-1 mt-4">
      <h3 className="font-medium text-sm mb-2">{title}</h3>
      {Object.entries(data).map(([key, value]) => {
        if (value === undefined || value === '') return null
        return (
          <div key={key} className="text-xs text-foreground-light font-mono">
            <span className="text-foreground-lighter">{formatKey(key)}: </span>
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
          </div>
        )
      })}
    </div>
  )
}

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, projectName } = useParams()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [showAdvanced, setShowAdvanced] = useState<Boolean[]>(false)
  const db = useRef<PGlite | null>()
  const [services, setServices] = useState<SupabaseService[]>([])
  const [title, setTitle] = useState<string>('')
  const [userInfo, setUserInfo] = useState<UserInfo>()
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>()

  useEffect(() => {
    db.current = new PGlite()
    db.current.exec(`
        CREATE SCHEMA auth;
        CREATE TABLE auth.users (
            instance_id uuid,
            id uuid NOT NULL,
            aud character varying(255),
            role character varying(255),
            email character varying(255),
            encrypted_password character varying(255),
            confirmed_at timestamp with time zone,
            invited_at timestamp with time zone,
            confirmation_token character varying(255),
            confirmation_sent_at timestamp with time zone,
            recovery_token character varying(255),
            recovery_sent_at timestamp with time zone,
            email_change_token character varying(255),
            email_change character varying(255),
            email_change_sent_at timestamp with time zone,
            last_sign_in_at timestamp with time zone,
            raw_app_meta_data jsonb,
            raw_user_meta_data jsonb,
            is_super_admin boolean,
            created_at timestamp with time zone,
            updated_at timestamp with time zone
        );
        ALTER TABLE ONLY auth.users
        ADD CONSTRAINT users_email_key UNIQUE (email);
        ALTER TABLE ONLY auth.users
        ADD CONSTRAINT users_pkey PRIMARY KEY (id);
      `)
  }, [])

  const {
    messages,
    input,
    handleInputChange,
    append,
    setInput,
    isLoading: isMessagesLoading,
  } = useChat({
    api: `${BASE_PATH}/api/ai/onboarding/design`,
    id: 'schema-generator',
    maxSteps: 7,
    // Handle client-side tools
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'executeSql') {
        if (!db.current) return { success: false, error: 'Database not initialized' }
        try {
          console.log('Executing SQL:', toolCall.args.sql)
          await db.current.exec((toolCall.args as { sql: string }).sql)

          const pgMeta = new PostgresMetaBase({
            query: async (sql: string) => {
              try {
                const res = await db.current?.query(sql)
                return wrapResult<any[]>(res.rows)
              } catch (error) {
                console.error('Query failed:', error)
                return wrapError(error, sql)
              }
            },
            end: async () => {},
          })

          const { data: tables, error } = await pgMeta.tables.list({
            includedSchemas: ['public'],
            includeColumns: true,
          })

          if (error) {
            console.error('Failed to get tables:', error)
            return { success: false, error: `Failed to get tables: ${error}` }
          }

          if (tables) {
            const graphData = await getGraphDataFromTables(tables)
            setNodes(graphData.nodes)
            setEdges(graphData.edges)
          }

          return {
            success: true,
            message: 'Database successfully updated. Respond with next steps.',
          }
        } catch (error) {
          console.error('Failed to execute SQL:', error)
          return {
            success: false,
            error: `SQL execution failed: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      }

      if (toolCall.toolName === 'setServices') {
        const newServices = (toolCall.args as { services: SupabaseService[] }).services
        setServices(newServices)
        return 'Services updated successfully'
      }

      if (toolCall.toolName === 'setTitle') {
        const newTitle = (toolCall.args as { title: string }).title
        setTitle(newTitle)
        return 'Title updated successfully'
      }

      if (toolCall.toolName === 'saveUserInfo') {
        setUserInfo(toolCall.args as UserInfo)
        return 'User info saved successfully'
      }

      if (toolCall.toolName === 'setDatabaseConfig') {
        setDbConfig(toolCall.args as DatabaseConfig)
        return 'Database config saved successfully'
      }
    },
  })

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const projectVersionSelectionDisabled = useFlag('disableProjectVersionSelection')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const allowOrioleDB = useFlag('allowOrioleDb')
  const { data: membersExceededLimit, isLoading: isLoadingFreeProjectLimitCheck } =
    useFreeProjectLimitCheckQuery({ slug })

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  const { data: orgSubscription } = useOrgSubscriptionQuery({ orgSlug: slug })

  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({
    enabled:
      orgSubscription !== undefined &&
      !['team', 'enterprise'].includes(orgSubscription?.plan.id ?? ''),
  })
  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === currentOrg?.id
  )
  const hasOutstandingInvoices = overdueInvoices.length > 0

  const { data: allProjects } = useProjectsQuery({})
  const organizationProjects =
    allProjects?.filter(
      (project) =>
        project.organization_id === currentOrg?.id && project.status !== PROJECT_STATUS.INACTIVE
    ) ?? []
  const { data: defaultRegion, error: defaultRegionError } = useDefaultRegionQuery(
    {
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    }
  )

  const {
    mutate: createProject,
    isLoading: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      router.push(`/project/${res.ref}/building`)
    },
  })

  const isAdmin = useCheckPermissions(PermissionAction.CREATE, 'projects')
  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const freePlanWithExceedingLimits =
    orgSubscription?.plan?.id === 'free' && hasMembersExceedingFreeTierLimit

  const isManagedByVercel = currentOrg?.managed_by === 'vercel-marketplace'

  const canCreateProject =
    isAdmin && !freePlanWithExceedingLimits && !isManagedByVercel && !hasOutstandingInvoices

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)

    form.setValue('dbPassStrength', strength)
    form.trigger('dbPassStrength')
    form.trigger('dbPass')

    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  FormSchema.superRefine(({ dbPassStrength }, refinementContext) => {
    if (dbPassStrength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dbPass'],
        message: passwordStrengthWarning || 'Password not secure enough',
      })
    }
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      organization: slug,
      projectName: projectName || '',
      postgresVersion: '',
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
      dbPass: '',
      dbPassStrength: 0,
      dbRegion: defaultRegion || undefined,
      instanceSize: sizes[0],
      dataApi: true,
      useApiSchema: false,
      postgresVersionSelection: '',
      useOrioleDb: false,
    },
  })

  const { instanceSize, cloudProvider, dbRegion, organization } = form.watch()

  const availableOrioleVersion = useAvailableOrioleImageVersion({
    cloudProvider: cloudProvider as CloudProvider,
    dbRegion,
    organizationSlug: organization,
  })

  // [kevin] This will eventually all be provided by a new API endpoint to preview and validate project creation, this is just for kaizen now
  const monthlyComputeCosts =
    // current project costs
    organizationProjects.reduce(
      (prev, acc) => prev + monthlyInstancePrice(acc.infra_compute_size),
      0
    ) +
    // selected compute size
    monthlyInstancePrice(instanceSize) -
    // compute credits
    10

  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)
    delayedCheckPasswordStrength(password)
  }

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!currentOrg) return console.error('Unable to retrieve current organization')

    const {
      cloudProvider,
      projectName,
      dbPass,
      dbRegion,
      postgresVersion,
      instanceSize,
      dataApi,
      useApiSchema,
      postgresVersionSelection,
      useOrioleDb,
    } = values

    if (useOrioleDb && !availableOrioleVersion) {
      return toast.error('No available OrioleDB image found, only Postgres is available')
    }

    const { postgresEngine, releaseChannel } =
      extractPostgresVersionDetails(postgresVersionSelection)

    const data: ProjectCreateVariables = {
      cloudProvider: cloudProvider,
      organizationId: currentOrg.id,
      name: projectName,
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize:
        orgSubscription?.plan.id === 'free' ? undefined : (instanceSize as DesiredInstanceSize),
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: !dataApi ? false : useApiSchema,
      postgresEngine: useOrioleDb ? availableOrioleVersion?.postgres_engine : postgresEngine,
      releaseChannel: useOrioleDb ? availableOrioleVersion?.release_channel : releaseChannel,
    }

    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        toast.error(
          `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`
        )
      }

      data['customSupabaseRequest'] = {
        ami: { search_tags: { 'tag:postgresVersion': postgresVersion } },
      }
    }

    createProject(data)
  }

  useEffect(() => {
    // Handle no org: redirect to new org route
    if (isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, router])

  useEffect(() => {
    // [Joshen] Cause slug depends on router which doesnt load immediately on render
    // While the form data does load immediately
    if (slug) form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
  }, [slug])

  useEffect(() => {
    // Redirect to first org if the slug doesn't match an org slug
    // this is mainly to capture the /new/new-project url, which is redirected from database.new
    if (isInvalidSlug && isOrganizationsSuccess && (organizations?.length ?? 0) > 0) {
      router.push(`/new/${organizations?.[0].slug}`)
    }
  }, [isInvalidSlug, isOrganizationsSuccess, organizations])

  useEffect(() => {
    if (form.getValues('dbRegion') === undefined && defaultRegion) {
      form.setValue('dbRegion', defaultRegion)
    }
  }, [defaultRegion])

  useEffect(() => {
    if (defaultRegionError) {
      form.setValue('dbRegion', PROVIDERS[DEFAULT_PROVIDER].default_region.displayName)
    }
  }, [defaultRegionError])

  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0

  const additionalMonthlySpend =
    instanceSizeSpecs[instanceSize as DbInstanceSize]!.priceMonthly - availableComputeCredits

  const selectedRegionObject = useMemo(() => {
    const dbRegion = form.getValues('dbRegion')
    const awsRegion = Object.entries(AWS_REGIONS).find(
      ([_, region]) => region.displayName === dbRegion
    )
    const flyRegion = Object.entries(FLY_REGIONS).find(
      ([_, region]) => region.displayName === dbRegion
    )

    if (awsRegion) {
      const [name, details] = awsRegion
      return {
        name,
        location: details.location,
        code: details.code,
        displayName: details.displayName,
      }
    }

    if (flyRegion) {
      const [name, details] = flyRegion
      return {
        name,
        location: details.location,
        code: details.code,
        displayName: details.displayName,
      }
    }

    return null
  }, [form.getValues('dbRegion')])

  if (!isOrganizationsSuccess || isLoadingFreeProjectLimitCheck) return null

  return (
    <div className="flex w-full h-screen overflow-hidden flex-col">
      <Link
        href="/projects"
        className="fixed top-4 left-4 rounded border p-2 hover:border-white border-default"
      >
        <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" style={{ height: 16 }} />
      </Link>
      {/* <div className="border-b bg-muted py-3 px-12">
        <div className="flex justify-between items-stretch">
          <Link
            href="/projects"
            className="text-xs font-mono text-foreground-light flex gap-4 items-center"
          >
            <img
              className="rounded border p-3 hover:border-white border-default"
              src={`${BASE_PATH}/img/supabase-logo.svg`}
              alt="Supabase"
              style={{ height: 16 }}
            />
            Back to dashboard
          </Link>
          <div className="flex justify-between items-stretch">
            <Button
              htmlType="submit"
              className="text-sm h-auto"
              loading={isCreatingNewProject || isSuccessNewProject}
              disabled={!canCreateProject || isCreatingNewProject || isSuccessNewProject}
            >
              Create new project
            </Button>
          </div>
        </div>
      </div> */}
      <div className="overflow-auto flex-1 flex items-start">
        <Form_Shadcn_ {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-[600px] p-24 pr-0 min-h-screen flex items-center"
          >
            <section className="relative">
              <div>
                <div className="mb-4">
                  <h3 className="mb-1">Create a new project</h3>
                  <p className="text-sm text-foreground-lighter">
                    Your project will have its own dedicated instance and full Postgres database,
                    including an automated API.
                  </p>
                </div>
                <>
                  {projectCreationDisabled ? (
                    <div className="pb-8">
                      <DisabledWarningDueToIncident title="Project creation is currently disabled" />
                    </div>
                  ) : (
                    <div className="">
                      <div className="pb-4 border-b grid grid-cols-2 gap-2">
                        <FormField_Shadcn_
                          control={form.control}
                          name="organization"
                          render={({ field }) => (
                            <FormItemLayout label="Organization">
                              {(organizations?.length ?? 0) > 0 && (
                                <Select_Shadcn_
                                  onValueChange={(slug) => {
                                    field.onChange(slug)
                                    router.push(`/new/${slug}`)
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl_Shadcn_>
                                    <SelectTrigger_Shadcn_>
                                      <SelectValue_Shadcn_ placeholder="Select an organization" />
                                    </SelectTrigger_Shadcn_>
                                  </FormControl_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    <SelectGroup_Shadcn_>
                                      {organizations?.map((x: any) => (
                                        <SelectItem_Shadcn_ key={x.id} value={x.slug}>
                                          {x.name}
                                        </SelectItem_Shadcn_>
                                      ))}
                                    </SelectGroup_Shadcn_>
                                  </SelectContent_Shadcn_>
                                </Select_Shadcn_>
                              )}
                            </FormItemLayout>
                          )}
                        />
                        {canCreateProject && (
                          <div>
                            <FormField_Shadcn_
                              control={form.control}
                              name="projectName"
                              render={({ field }) => (
                                <FormItemLayout label="Project name">
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      placeholder="Project name"
                                      {...field}
                                      onChange={(event) => {
                                        field.onChange(event.target.value.replace(/\./g, ''))
                                      }}
                                    />
                                  </FormControl_Shadcn_>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                        )}
                      </div>
                      {!isAdmin && <NotOrganizationOwnerWarning />}

                      {canCreateProject && (
                        <>
                          <div className="py-4 border-b">
                            <FormField_Shadcn_
                              control={form.control}
                              name="dbRegion"
                              render={({ field }) => (
                                <RegionSelector
                                  field={field}
                                  form={form}
                                  cloudProvider={form.getValues('cloudProvider') as CloudProvider}
                                />
                              )}
                            />
                          </div>
                          <div className="py-4 border-b">
                            <FormField_Shadcn_
                              control={form.control}
                              name="dbPass"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Database Password"
                                  description={
                                    <PasswordStrengthBar
                                      passwordStrengthScore={form.getValues('dbPassStrength')}
                                      password={field.value}
                                      passwordStrengthMessage={passwordStrengthMessage}
                                      generateStrongPassword={generatePassword}
                                    />
                                  }
                                >
                                  <FormControl_Shadcn_>
                                    <Input
                                      copy={field.value.length > 0}
                                      type="password"
                                      placeholder="Type in a strong password"
                                      {...field}
                                      autoComplete="off"
                                      onChange={async (event) => {
                                        field.onChange(event)
                                        form.trigger('dbPassStrength')
                                        const value = event.target.value
                                        if (event.target.value === '') {
                                          await form.setValue('dbPassStrength', 0)
                                          await form.trigger('dbPass')
                                        } else {
                                          await delayedCheckPasswordStrength(value)
                                        }
                                      }}
                                    />
                                  </FormControl_Shadcn_>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                          <div className="py-4 border-b">
                            <FormItemLayout label="Generate a starting schema">
                              <div className="rounded-md border bg-surface-100">
                                {messages.length > 0 && (
                                  <div className="px-4 py-3 border-b space-y-1">
                                    <p className="text-foreground-light">
                                      {messages.filter((m) => m.role === 'user').slice(-1)[0]
                                        ?.content || ''}
                                    </p>
                                    <p>
                                      {messages[messages.length - 1].role === 'user' ||
                                      messages[messages.length - 1].content === '' ? (
                                        <motion.div className="text-foreground-lighter text-sm flex gap-1.5 items-center">
                                          <span>Thinking</span>
                                          <div className="flex gap-1">
                                            <motion.span
                                              animate={{ opacity: [0, 1, 0] }}
                                              transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: 0,
                                              }}
                                            >
                                              .
                                            </motion.span>
                                            <motion.span
                                              animate={{ opacity: [0, 1, 0] }}
                                              transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: 0.3,
                                              }}
                                            >
                                              .
                                            </motion.span>
                                            <motion.span
                                              animate={{ opacity: [0, 1, 0] }}
                                              transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: 0.6,
                                              }}
                                            >
                                              .
                                            </motion.span>
                                          </div>
                                        </motion.div>
                                      ) : (
                                        <Markdown
                                          className="text-foreground"
                                          content={
                                            messages
                                              .filter((m) => m.role === 'assistant')
                                              .slice(-1)[0]?.content || ''
                                          }
                                        />
                                      )}
                                    </p>
                                  </div>
                                )}
                                <textarea
                                  id="input"
                                  name="prompt"
                                  autoComplete="off"
                                  className="w-full px-4 text-sm py-2 border-none block bg-muted mb-0 text-foreground-light placeholder:text-foreground-lighter"
                                  value={input}
                                  disabled={isMessagesLoading}
                                  onChange={handleInputChange}
                                  placeholder={
                                    messages.length > 0
                                      ? 'Make an edit...'
                                      : 'Describe your application...'
                                  }
                                  autoFocus
                                  rows={
                                    messages.length > 0
                                      ? Math.max(1, Math.min(input.split('\n').length, 10))
                                      : Math.max(3, Math.min(input.split('\n').length, 10))
                                  }
                                  onKeyDown={(e) => {
                                    if (!(e.target instanceof HTMLTextAreaElement)) {
                                      return
                                    }
                                    if (
                                      e.key === 'Enter' &&
                                      !e.shiftKey &&
                                      !e.nativeEvent.isComposing
                                    ) {
                                      e.preventDefault()
                                      append({ role: 'user', content: input })
                                      setInput('')
                                    }
                                  }}
                                />
                              </div>
                            </FormItemLayout>
                          </div>
                          <div>
                            {!showAdvanced && (
                              <Button
                                onClick={() => setShowAdvanced(true)}
                                icon={<Settings size={16} />}
                                type="outline"
                                className="w-full mb-2 mt-4"
                              >
                                Advanced Configuration
                              </Button>
                            )}
                            <div className={cn(showAdvanced ? 'block' : 'hidden')}>
                              {cloudProviderEnabled && showNonProdFields && (
                                <div className="py-4 border-b">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="cloudProvider"
                                    render={({ field }) => (
                                      <FormItemLayout label="Cloud provider">
                                        <Select_Shadcn_
                                          onValueChange={(value) => {
                                            field.onChange(value)
                                            form.setValue(
                                              'dbRegion',
                                              value === 'FLY'
                                                ? FLY_REGIONS_DEFAULT.displayName
                                                : AWS_REGIONS_DEFAULT.displayName
                                            )
                                          }}
                                          defaultValue={field.value}
                                        >
                                          <FormControl_Shadcn_>
                                            <SelectTrigger_Shadcn_>
                                              <SelectValue_Shadcn_ placeholder="Select a cloud provider" />
                                            </SelectTrigger_Shadcn_>
                                          </FormControl_Shadcn_>
                                          <SelectContent_Shadcn_>
                                            <SelectGroup_Shadcn_>
                                              {Object.values(PROVIDERS).map((providerObj) => {
                                                const label = providerObj['name']
                                                const value = providerObj['id']
                                                return (
                                                  <SelectItem_Shadcn_ key={value} value={value}>
                                                    {label}
                                                  </SelectItem_Shadcn_>
                                                )
                                              })}
                                            </SelectGroup_Shadcn_>
                                          </SelectContent_Shadcn_>
                                        </Select_Shadcn_>
                                      </FormItemLayout>
                                    )}
                                  />
                                </div>
                              )}

                              {orgSubscription?.plan && orgSubscription?.plan.id !== 'free' && (
                                <div className="py-4 border-b">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="instanceSize"
                                    render={({ field }) => (
                                      <FormItemLayout
                                        label={
                                          <div className="flex flex-col gap-y-4">
                                            <span>Compute Size</span>
                                          </div>
                                        }
                                        description={
                                          <>
                                            <p>
                                              The size for your dedicated database. You can change
                                              this later.
                                            </p>
                                          </>
                                        }
                                      >
                                        <Select_Shadcn_
                                          value={field.value}
                                          onValueChange={(value) => field.onChange(value)}
                                        >
                                          <SelectTrigger_Shadcn_ className="[&_.instance-details]:hidden">
                                            <SelectValue_Shadcn_ placeholder="Select a compute size" />
                                          </SelectTrigger_Shadcn_>
                                          <SelectContent_Shadcn_>
                                            <SelectGroup_Shadcn_>
                                              {sizes
                                                .filter((option) =>
                                                  instanceSizeSpecs[
                                                    option
                                                  ].cloud_providers.includes(
                                                    form.getValues('cloudProvider') as CloudProvider
                                                  )
                                                )
                                                .map((option) => {
                                                  return (
                                                    <SelectItem_Shadcn_ key={option} value={option}>
                                                      <div className="flex flex-row i gap-2">
                                                        <div className="text-center w-[80px]">
                                                          <Badge
                                                            variant={
                                                              option === 'micro'
                                                                ? 'default'
                                                                : 'brand'
                                                            }
                                                            className="rounded-md w-16 text-center flex justify-center font-mono uppercase"
                                                          >
                                                            {instanceSizeSpecs[option].label}
                                                          </Badge>
                                                        </div>
                                                        <div className="text-sm">
                                                          <span className="text-foreground">
                                                            {instanceSizeSpecs[option].ram} RAM /{' '}
                                                            {instanceSizeSpecs[option].cpu}{' '}
                                                            {getCloudProviderArchitecture(
                                                              form.getValues(
                                                                'cloudProvider'
                                                              ) as CloudProvider
                                                            )}{' '}
                                                            CPU
                                                          </span>
                                                          <p className="text-xs text-muted instance-details">
                                                            ${instanceSizeSpecs[option].priceHourly}
                                                            /hour (~$
                                                            {instanceSizeSpecs[option].priceMonthly}
                                                            /month)
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </SelectItem_Shadcn_>
                                                  )
                                                })}
                                            </SelectGroup_Shadcn_>
                                          </SelectContent_Shadcn_>
                                        </Select_Shadcn_>
                                      </FormItemLayout>
                                    )}
                                  />

                                  <FormItemLayout>
                                    <div className="flex justify-between mr-2 mt-4">
                                      <span>Additional Monthly Compute Costs</span>
                                      <div className="text-brand flex gap-1 items-center">
                                        {organizationProjects.length > 0 ? (
                                          <>
                                            <span>${additionalMonthlySpend}</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="text-foreground-lighter line-through">
                                              $
                                              {
                                                instanceSizeSpecs[instanceSize as DbInstanceSize]!
                                                  .priceMonthly
                                              }
                                            </span>
                                            <span>${additionalMonthlySpend}</span>
                                          </>
                                        )}
                                        <InfoTooltip side="top" className="max-w-[450px] p-0">
                                          <Table className="mt-2">
                                            <TableHeader className="[&_th]:h-7">
                                              <TableRow className="py-2">
                                                <TableHead className="w-[170px]">Project</TableHead>
                                                <TableHead>Compute Size</TableHead>
                                                <TableHead className="text-right">
                                                  Monthly Costs
                                                </TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody className="[&_td]:py-2">
                                              {organizationProjects.map((project) => (
                                                <TableRow
                                                  key={project.ref}
                                                  className="text-foreground-light"
                                                >
                                                  <TableCell className="w-[170px] truncate">
                                                    {project.name}
                                                  </TableCell>
                                                  <TableCell className="text-center">
                                                    {instanceLabel(project.infra_compute_size)}
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    $
                                                    {monthlyInstancePrice(
                                                      project.infra_compute_size
                                                    )}
                                                  </TableCell>
                                                </TableRow>
                                              ))}

                                              <TableRow>
                                                <TableCell className="w-[170px] flex gap-2">
                                                  <span className="truncate">
                                                    {form.getValues('projectName')
                                                      ? form.getValues('projectName')
                                                      : 'New project'}
                                                  </span>
                                                  <Badge size={'small'} variant={'default'}>
                                                    NEW
                                                  </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  {instanceLabel(instanceSize)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  ${monthlyInstancePrice(instanceSize)}
                                                </TableCell>
                                              </TableRow>
                                            </TableBody>
                                          </Table>
                                          <PopoverSeparator />
                                          <Table>
                                            <TableHeader className="[&_th]:h-7">
                                              <TableRow>
                                                <TableHead colSpan={2}>Compute Credits</TableHead>
                                                <TableHead colSpan={1} className="text-right">
                                                  -$10
                                                </TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody className="[&_td]:py-2">
                                              <TableRow className="text-foreground">
                                                <TableCell colSpan={2}>
                                                  Total Monthly Compute Costs
                                                  {/**
                                                   * API currently doesnt output replica information on the projects list endpoint. Until then, we cannot correctly calculate the costs including RRs.
                                                   *
                                                   * Will be adjusted in the future [kevin]
                                                   */}
                                                  {organizationProjects.length > 0 && (
                                                    <p className="text-xs text-foreground-lighter">
                                                      Excluding Read replicas
                                                    </p>
                                                  )}
                                                </TableCell>
                                                <TableCell colSpan={1} className="text-right">
                                                  ${monthlyComputeCosts}
                                                </TableCell>
                                              </TableRow>
                                            </TableBody>
                                          </Table>

                                          <div className="p-4 text-xs text-foreground-light space-y-1">
                                            <p>
                                              Compute is charged usage-based whenever your billing
                                              cycle resets. Given compute charges are hourly, your
                                              invoice will contain "Compute Hours" for each hour a
                                              project ran on a specific compute size.
                                            </p>
                                            {monthlyComputeCosts > 0 && (
                                              <p>
                                                Compute costs are applied on top of your
                                                subscription plan costs.
                                              </p>
                                            )}
                                          </div>
                                        </InfoTooltip>
                                      </div>
                                    </div>

                                    <div className="mt-2 text-foreground-lighter space-y-1">
                                      {additionalMonthlySpend > 0 &&
                                      availableComputeCredits === 0 ? (
                                        <p>
                                          Your monthly spend will increase, and can be more than
                                          above if you exceed your plan's usage quota. Your
                                          organization includes $10/month of compute credits, which
                                          you already exceed with your existing projects.
                                        </p>
                                      ) : additionalMonthlySpend > 0 &&
                                        availableComputeCredits > 0 ? (
                                        <p>
                                          Your monthly spend will increase, and can be more than
                                          above if you exceed your plan's usage quota. Your
                                          organization includes $10/month of compute credits, which
                                          you exceed with the selected compute size.
                                        </p>
                                      ) : (
                                        <p>
                                          Your monthly spend won't increase, unless you exceed your
                                          plan's usage quota. Your organization includes $10/month
                                          of compute credits, which cover this project.
                                        </p>
                                      )}
                                    </div>
                                  </FormItemLayout>
                                  <div className="flex flex-col gap-y-2 my-4">
                                    <Link
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href="https://supabase.com/docs/guides/platform/compute-add-ons"
                                    >
                                      <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                        <p className="text-sm m-0">Compute Add-Ons</p>
                                        <ExternalLink size={16} strokeWidth={1.5} />
                                      </div>
                                    </Link>
                                    <Link
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href="https://supabase.com/docs/guides/platform/org-based-billing#billing-for-compute-compute-hours"
                                    >
                                      <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                        <p className="text-sm m-0">Compute Billing</p>
                                        <ExternalLink size={16} strokeWidth={1.5} />
                                      </div>
                                    </Link>
                                  </div>
                                </div>
                              )}

                              {!projectVersionSelectionDisabled && (
                                <div className="py-4 border-b">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="postgresVersionSelection"
                                    render={({ field }) => (
                                      <PostgresVersionSelector
                                        field={field}
                                        form={form}
                                        cloudProvider={
                                          form.getValues('cloudProvider') as CloudProvider
                                        }
                                        organizationSlug={slug}
                                        dbRegion={form.getValues('dbRegion')}
                                      />
                                    )}
                                  />
                                </div>
                              )}

                              {showNonProdFields && (
                                <div className="py-4 border-b">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="postgresVersion"
                                    render={({ field }) => (
                                      <FormItemLayout
                                        label="Custom Postgres version"
                                        description="Specify a custom version of Postgres (Defaults to the latest). This is only applicable for local/staging projects"
                                      >
                                        <FormControl_Shadcn_>
                                          <Input_Shadcn_
                                            placeholder="Postgres version"
                                            {...field}
                                            autoComplete="off"
                                          />
                                        </FormControl_Shadcn_>
                                      </FormItemLayout>
                                    )}
                                  />
                                </div>
                              )}

                              <SecurityOptions form={form} />
                              {allowOrioleDB && !!availableOrioleVersion && (
                                <AdvancedConfiguration form={form} />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {freePlanWithExceedingLimits ? (
                        isAdmin &&
                        slug && (
                          <div className="py-4 border-b">
                            <FreeProjectLimitWarning
                              membersExceededLimit={membersExceededLimit || []}
                              orgSlug={slug}
                            />
                          </div>
                        )
                      ) : isManagedByVercel ? (
                        <div className="py-4 border-b">
                          <PartnerManagedResource
                            partner="vercel-marketplace"
                            resource="Projects"
                            cta={{
                              installationId: currentOrg?.partner_id,
                              message: 'Visit Vercel to create a project',
                            }}
                          />
                        </div>
                      ) : hasOutstandingInvoices ? (
                        <div className="py-4 border-b">
                          <Admonition
                            type="default"
                            title="Your organization has overdue invoices"
                            description={
                              <div className="space-y-3">
                                <p className="text-sm leading-normal">
                                  Please resolve all outstanding invoices first before creating a
                                  new project
                                </p>

                                <div>
                                  <Button asChild type="default">
                                    <Link href={`/org/${slug}/invoices`}>View invoices</Link>
                                  </Button>
                                </div>
                              </div>
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              </div>
              <Button className="w-full sticky top-0">Create project</Button>
            </section>
          </form>
        </Form_Shadcn_>
        <section className="flex-1 h-screen overflow-hidden sticky top-0">
          <div className="flex h-full flex-1">
            <div className="flex-1 h-full relative">
              <motion.div
                key="info"
                transition={{
                  duration: 1.25,
                  ease: 'easeInOut',
                }}
                className={`absolute z-30 p-4 bg-surface-100 min-w-80 rounded-lg border shadow-lg`}
                initial={false}
                animate={
                  nodes.length > 0
                    ? {
                        top: '3%',
                        right: '3%',
                        x: '0%',
                        y: '0%',
                      }
                    : {
                        top: '50%',
                        right: '50%',
                        x: '50%',
                        y: '-50%',
                      }
                }
              >
                <div className="flex items-start justify-between w-80">
                  <div className="flex gap-x-3">
                    {/* <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
                      <Database size={16} />
                    </div> */}
                    <div className="flex flex-col gap-y-0.5">
                      <p className="text-sm">Primary Database</p>
                      <p className="flex items-center gap-x-1">
                        <span className="text-sm text-foreground-light">
                          {form.getValues('dbRegion')}
                        </span>
                      </p>
                      <p className="flex items-center gap-x-1">
                        <span className="text-sm text-foreground-light">
                          {form.getValues('cloudProvider')}
                        </span>
                        <span className="text-sm text-foreground-light">•</span>
                        <span className="text-sm text-foreground-light">
                          {instanceLabel(form.getValues('computeSize'))}
                        </span>
                        <span className="text-sm text-foreground-light">•</span>
                        <span className="text-sm text-foreground-light">
                          {form.getValues('postgresVersionSelection')}
                        </span>
                      </p>
                    </div>
                  </div>
                  {selectedRegionObject && (
                    <img
                      alt="region icon"
                      className="w-8 rounded-sm mt-0.5"
                      src={`${BASE_PATH}/img/regions/${selectedRegionObject.name}.svg`}
                    />
                  )}
                </div>

                <TooltipProvider_Shadcn_>
                  <div className="flex gap-2 mt-4">
                    {[
                      { name: 'Auth', icon: User2 },
                      { name: 'Storage', icon: File },
                      { name: 'Database', icon: Database },
                      { name: 'Edge Function', icon: Zap },
                      { name: 'Cron', icon: Clock },
                      { name: 'Queues', icon: ListOrdered },
                      { name: 'Vector', icon: Box },
                    ].map((service) => {
                      const enabledService = services.find((s) => s.name === service.name)
                      const isEnabled = !!enabledService
                      return (
                        <Tooltip_Shadcn_ key={service.name} delayDuration={100}>
                          <TooltipTrigger_Shadcn_ asChild>
                            <div
                              className={`
                            flex items-center justify-center w-10 h-10 border rounded cursor-help
                            ${isEnabled ? 'border-brand-600 text-brand-600' : 'text-foreground-lighter'}
                          `}
                            >
                              <service.icon size={16} strokeWidth={2} />
                            </div>
                          </TooltipTrigger_Shadcn_>
                          <TooltipContent_Shadcn_>
                            {isEnabled ? `${service.name}: ${enabledService.reason}` : service.name}
                          </TooltipContent_Shadcn_>
                        </Tooltip_Shadcn_>
                      )
                    })}
                  </div>
                </TooltipProvider_Shadcn_>
              </motion.div>
              <motion.div
                layout
                layoutId="globe"
                className="absolute z-10 pointer-events-none aspect-square right-0"
                initial={{
                  x: nodes.length > 0 ? '75%' : '25%',
                  opacity: 1,
                  width: nodes.length > 0 ? '60%' : '100%',
                  top: nodes.length > 0 ? '0' : '50%',
                  y: nodes.length > 0 ? '-25%' : '-50%',
                }}
                animate={{
                  x: nodes.length > 0 ? '25%' : '25%',
                  opacity: 1,
                  width: nodes.length > 0 ? '60%' : '100%',
                  top: nodes.length > 0 ? '0' : '50%',
                  y: nodes.length > 0 ? '-25%' : '-50%',
                }}
                style={{ maskImage: 'linear-gradient(to top right, black, transparent 50%)' }}
                transition={{
                  duration: 1.25,
                  ease: 'easeInOut',
                }}
              >
                <Globe
                  currentLocation={selectedRegionObject?.location}
                  markers={[
                    ...Object.values(AWS_REGIONS).map((region) => region.location),
                    ...Object.values(FLY_REGIONS).map((region) => region.location),
                  ]}
                />
              </motion.div>
              <AnimatePresence>
                {nodes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 1 } }}
                    exit={{ opacity: 0 }}
                    className="h-full z-20"
                  >
                    <ReactFlowProvider>
                      <SchemaFlow nodes={nodes} edges={edges} />
                    </ReactFlowProvider>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/**
 * When launching new projects, they only get assigned a compute size once successfully launched,
 * this might assume wrong compute size, but only for projects being rapidly launched after one another on non-default compute sizes.
 *
 * Needs to be in the API in the future [kevin]
 */
const monthlyInstancePrice = (instance: string | undefined): number => {
  return instanceSizeSpecs[instance as DbInstanceSize]?.priceMonthly || 10
}

const instanceLabel = (instance: string | undefined): string => {
  return instanceSizeSpecs[instance as DbInstanceSize]?.label || 'Micro'
}

type TableNodeData = {
  name: string
  isForeign: boolean
  columns: {
    id: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isUpdateable: boolean
    isIdentity: boolean
    name: string
    format: string
  }[]
}

async function getGraphDataFromTables(tables: PostgresTable[]): Promise<{
  nodes: Node<TableNodeData>[]
  edges: Edge[]
}> {
  if (!tables.length) {
    return { nodes: [], edges: [] }
  }

  const nodes = tables.map((table) => {
    const columns = (table.columns || [])
      .sort((a, b) => a.ordinal_position - b.ordinal_position)
      .map((column) => {
        return {
          id: column.id,
          isPrimary: table.primary_keys.some((pk) => pk.name === column.name),
          name: column.name,
          format: column.format,
          isNullable: column.is_nullable,
          isUnique: column.is_unique,
          isUpdateable: column.is_updatable,
          isIdentity: column.is_identity,
        }
      })

    return {
      id: `${table.id}`,
      type: 'table',
      data: {
        name: table.name,
        isForeign: false,
        columns,
      },
      position: { x: 0, y: 0 },
    }
  })

  const edges: Edge[] = []
  const currentSchema = tables[0].schema
  const uniqueRelationships = uniqBy(
    tables.flatMap((t) => t.relationships),
    'id'
  )

  for (const rel of uniqueRelationships) {
    // TODO: Support [external->this] relationship?
    if (rel.source_schema !== currentSchema) {
      continue
    }

    // Create additional [this->foreign] node that we can point to on the graph.
    if (rel.target_table_schema !== currentSchema) {
      nodes.push({
        id: rel.constraint_name,
        type: 'table',
        data: {
          name: `${rel.target_table_schema}.${rel.target_table_name}.${rel.target_column_name}`,
          isForeign: true,
          columns: [],
        },
        position: { x: 0, y: 0 },
      })

      const [source, sourceHandle] = findTablesHandleIds(
        tables,
        rel.source_table_name,
        rel.source_column_name
      )

      if (source) {
        edges.push({
          id: String(rel.id),
          type: 'table',
          source,
          sourceHandle,
          target: rel.constraint_name,
          targetHandle: rel.constraint_name,
        })
      }

      continue
    }

    const [source, sourceHandle] = findTablesHandleIds(
      tables,
      rel.source_table_name,
      rel.source_column_name
    )
    const [target, targetHandle] = findTablesHandleIds(
      tables,
      rel.target_table_name,
      rel.target_column_name
    )

    // We do not support [external->this] flow currently.
    if (source && target) {
      edges.push({
        id: String(rel.id),
        type: 'table',
        source,
        sourceHandle,
        target,
        targetHandle,
      })
    }
  }

  return layoutElements(nodes, edges)
}

function findTablesHandleIds(
  tables: PostgresTable[],
  table_name: string,
  column_name: string
): [string?, string?] {
  for (const table of tables) {
    if (table_name !== table.name) continue

    for (const column of table.columns || []) {
      if (column_name !== column.name) continue

      return [String(table.id), column.id]
    }
  }

  return []
}

/**
 * Positions nodes relative to each other on the graph using `dagre`.
 */
const layoutElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UR',
    nodesep: 50,
    ranksep: 50,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: TABLE_NODE_WIDTH / 2,
      height: (TABLE_NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1), // columns + header
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Left
    node.sourcePosition = Position.Right
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    }

    return node
  })

  return { nodes, edges }
}

export default withAuth(Wizard)
