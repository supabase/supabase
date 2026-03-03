'use client'

import { IS_PLATFORM, useFlag } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import {
  Clock5,
  Code2,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  LockKeyhole,
  Mail,
  MessageCircle,
  Plus,
  Rows,
  ShieldPlus,
  Table2,
  Telescope,
  UserCog,
  UserPlus,
  Vault,
  Webhook,
  Zap,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
} from 'ui-patterns/CommandMenu'
import type { CommandOptions, ICommand } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import {
  getIntegrationCommandName,
  getIntegrationRoute,
  useCreateCommandsConfig,
} from './CreateCommands.utils'

const AiIconAnimation = dynamic(() => import('ui').then((mod) => mod.AiIconAnimation))
const Badge = dynamic(() => import('ui').then((mod) => mod.Badge))
const EdgeFunctions = dynamic(() => import('icons').then((mod) => mod.EdgeFunctions))
const AnalyticsBucket = dynamic(() => import('icons').then((mod) => mod.AnalyticsBucket))
const FilesBucket = dynamic(() => import('icons').then((mod) => mod.FilesBucket))
const VectorBucket = dynamic(() => import('icons').then((mod) => mod.VectorBucket))
const Graphql = dynamic(() => import('icons').then((mod) => mod.Graphql))

const CREATE_STUDIO_ENTITY = 'Create Studio Entity'

export function useCreateCommands(options?: CommandOptions) {
  const enableCreateCommands = useFlag('enablecreatecommands')
  const setIsOpen = useSetCommandMenuOpen()
  const {
    ref,
    setPage,
    openSidebar,
    snap,
    authenticationOauth21,
    authEnabled,
    edgeFunctionsEnabled,
    storageEnabled,
    sendSmsHook,
    sendEmailHook,
    customAccessTokenHook,
    mfaVerificationHook,
    mfaVerificationHookEnabled,
    passwordVerificationHook,
    passwordVerificationHookEnabled,
    beforeUserCreatedHook,
    isVectorBucketsEnabled,
    isAnalyticsBucketsEnabled,
    installedIntegrationIds,
    allIntegrations,
    reportsEnabled,
  } = useCreateCommandsConfig()

  const databaseCommands = useMemo(
    () =>
      [
        {
          id: 'create-db-table',
          name: 'Create Table',
          route: `/project/${ref}/editor?create=table`,
          icon: () => <Table2 />,
        },
        {
          id: 'create-db-index',
          name: 'Create Index',
          route: `/project/${ref}/database/indexes?new=true`,
          icon: () => <Rows />,
        },
        {
          id: 'create-db-function',
          name: 'Create Database Function',
          route: `/project/${ref}/database/functions?new=true`,
          icon: () => <Code2 />,
        },
        {
          id: 'create-db-enum',
          name: 'Create Enumerated Type',
          route: `/project/${ref}/database/types?new=true`,
          icon: () => <ListChecks />,
        },
        {
          id: 'create-db-trigger',
          name: 'Create Database Trigger',
          route: `/project/${ref}/database/triggers?new=true`,
          icon: () => <Zap />,
        },
        {
          id: 'create-db-role',
          name: 'Create Database Role',
          route: `/project/${ref}/database/roles?new=true`,
          icon: () => <UserCog />,
        },
      ].filter(Boolean) as ICommand[],
    [ref]
  )

  const authCommands = useMemo(
    () =>
      authEnabled
        ? ([
            {
              id: 'create-auth-user',
              name: 'Create Auth User',
              route: `/project/${ref}/auth/users?new=true`,
              icon: () => <UserPlus />,
            },
            {
              id: 'create-rls-policy',
              name: 'Create RLS Policy',
              route: `/project/${ref}/auth/policies?new=true`,
              icon: () => <ShieldPlus />,
            },
            ...(IS_PLATFORM
              ? [
                  {
                    id: 'create-auth-hook-sms',
                    name: 'Create Auth Hook (SMS)',
                    route: `/project/${ref}/auth/hooks?hook=${sendSmsHook?.id}`,
                    icon: () => <MessageCircle />,
                  },
                  {
                    id: 'create-auth-hook-email',
                    name: 'Create Auth Hook (Email)',
                    route: `/project/${ref}/auth/hooks?hook=${sendEmailHook?.id}`,
                    icon: () => <Mail />,
                  },
                  {
                    id: 'create-auth-hook-custom-access-token',
                    name: 'Create Auth Hook (Custom Access Token)',
                    route: `/project/${ref}/auth/hooks?hook=${customAccessTokenHook?.id}`,
                    icon: () => <KeyRound />,
                  },
                  {
                    id: 'create-auth-hook-mfa-verification',
                    name: 'Create Auth Hook (MFA Verification Attempt)',
                    route: `/project/${ref}/auth/hooks?hook=${mfaVerificationHook?.id}`,
                    icon: () => <ShieldPlus />,
                    badge: () => (mfaVerificationHookEnabled ? <Badge>Team</Badge> : null),
                    className: mfaVerificationHookEnabled
                      ? 'opacity-50 cursor-not-allowed pointer-events-none'
                      : '',
                  },
                  {
                    id: 'create-auth-hook-password-verification',
                    name: 'Create Auth Hook (Password Verification Attempt)',
                    route: `/project/${ref}/auth/hooks?hook=${passwordVerificationHook?.id}`,
                    icon: () => <Lock />,
                    badge: () => (passwordVerificationHookEnabled ? <Badge>Team</Badge> : null),
                    className: passwordVerificationHookEnabled
                      ? 'opacity-50 cursor-not-allowed pointer-events-none'
                      : '',
                  },
                  {
                    id: 'create-auth-hook-before-user-created',
                    name: 'Create Auth Hook (Before User Created)',
                    route: `/project/${ref}/auth/hooks?hook=${beforeUserCreatedHook?.id}`,
                    icon: () => <KeyRound />,
                  },
                ]
              : []),
            ...(IS_PLATFORM && authenticationOauth21
              ? [
                  {
                    id: 'create-oauth-app',
                    name: 'Create OAuth App',
                    route: `/project/${ref}/auth/oauth-apps?new=true`,
                    icon: () => <KeyRound />,
                  },
                ]
              : []),
          ].filter(Boolean) as ICommand[])
        : [],
    [
      ref,
      authEnabled,
      sendSmsHook,
      sendEmailHook,
      customAccessTokenHook,
      mfaVerificationHook,
      mfaVerificationHookEnabled,
      passwordVerificationHook,
      passwordVerificationHookEnabled,
      beforeUserCreatedHook,
      authenticationOauth21,
    ]
  )

  const edgeFunctionsCommands = useMemo(
    () =>
      edgeFunctionsEnabled
        ? ([
            {
              id: 'create-edge-function-editor',
              name: 'Create Edge Function via Editor',
              route: `/project/${ref}/functions/new`,
              icon: () => <EdgeFunctions />,
            },
            {
              id: 'create-edge-function-cli',
              name: 'Create Edge Function via CLI',
              route: `/project/${ref}/functions?create=cli`,
              icon: () => <EdgeFunctions />,
            },
            {
              id: 'create-edge-function-ai',
              name: 'Create Edge Function via AI',
              action: () => {
                openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                snap.newChat({
                  name: 'Create new edge function',
                  initialInput: `Create a new edge function that ...`,
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      {
                        label: 'Stripe Payments',
                        description:
                          'Create a new edge function that processes payments with Stripe',
                      },
                      {
                        label: 'Email with Resend',
                        description: 'Create a new edge function that sends emails with Resend',
                      },
                      {
                        label: 'PDF Generator',
                        description:
                          'Create a new edge function that generates PDFs from HTML templates',
                      },
                    ],
                  },
                })
                setIsOpen(false)
              },
              icon: () => (
                <AiIconAnimation
                  allowHoverEffect={false}
                  size={20}
                  className="text-foreground-light"
                />
              ),
            },
            {
              id: 'create-edge-function-secret',
              name: 'Create Edge Function Secret',
              route: `/project/${ref}/functions/secrets`,
              icon: () => <LockKeyhole />,
            },
          ].filter(Boolean) as ICommand[])
        : [],
    [ref, edgeFunctionsEnabled, openSidebar, snap, setIsOpen]
  )

  const storageCommands = useMemo(
    () =>
      storageEnabled
        ? ([
            {
              id: 'create-storage-bucket-files',
              name: 'Create Storage Bucket (Files)',
              route: `/project/${ref}/storage/files?new=true`,
              icon: () => <FilesBucket />,
            },
            {
              id: 'create-storage-bucket-analytics',
              name: 'Create Storage Bucket (Analytics)',
              route: `/project/${ref}/storage/analytics?new=true`,
              icon: () => <AnalyticsBucket />,
              badge: () => <Badge variant="success">New</Badge>,
              className: !isAnalyticsBucketsEnabled
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : '',
              enabled: isAnalyticsBucketsEnabled,
            },
            {
              id: 'create-storage-bucket-vectors',
              name: 'Create Storage Bucket (Vectors)',
              route: `/project/${ref}/storage/vectors?new=true`,
              icon: () => <VectorBucket />,
              badge: () => <Badge variant="success">New</Badge>,
              className: !isVectorBucketsEnabled
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : '',
              enabled: isVectorBucketsEnabled,
            },
          ].filter(Boolean) as ICommand[])
        : [],
    [ref, storageEnabled, isAnalyticsBucketsEnabled, isVectorBucketsEnabled]
  )

  const integrationsCommands = useMemo(() => {
    // Sort integrations: Postgres modules (non-wrappers) first, then wrappers
    const sortedIntegrations = [...allIntegrations].sort((a, b) => {
      const aIsWrapper = a.type === 'wrapper' ? 1 : 0
      const bIsWrapper = b.type === 'wrapper' ? 1 : 0
      return aIsWrapper - bIsWrapper
    })

    return sortedIntegrations
      .map((integration) => {
        const route = getIntegrationRoute(integration, ref, installedIntegrationIds)
        if (!route) return null

        const isWrapper = integration.type === 'wrapper'

        // For wrappers, use the integration icon with wrapper styling
        // For Postgres modules, use plain icons
        const getIcon = () => {
          if (isWrapper) {
            return (
              <div className="w-6 h-6 relative bg-white border rounded-md flex items-center justify-center [&>img]:!p-1 [&>svg]:!p-1">
                {integration.icon()}
              </div>
            )
          }

          // Use plain icons for Postgres modules
          switch (integration.id) {
            case 'vault':
              return <Vault />
            case 'cron':
              return <Clock5 />
            case 'webhooks':
              return <Webhook />
            case 'queues':
              return <Layers />
            default:
              // Fallback to integration icon for other Postgres modules
              return integration.icon()
          }
        }

        return {
          id: `create-integration-${integration.id}`,
          name: getIntegrationCommandName(integration),
          route,
          icon: getIcon,
        }
      })
      .filter(Boolean) as ICommand[]
  }, [ref, allIntegrations, installedIntegrationIds])

  const observabilityCommands = useMemo(
    () => [
      ...(IS_PLATFORM && reportsEnabled
        ? ([
            {
              id: 'create-observability-report',
              name: 'Create Custom Report',
              route: `/project/${ref}/observability/api-overview?newReport=true`,
              icon: () => <Telescope />,
            },
          ].filter(Boolean) as ICommand[])
        : []),
    ],
    [ref, reportsEnabled]
  )

  const sections = useMemo(
    () => [
      {
        id: 'create-database',
        name: 'Database',
        commands: databaseCommands,
      },
      ...(authCommands.length > 0
        ? [
            {
              id: 'create-auth',
              name: 'Auth',
              commands: authCommands,
            },
          ]
        : []),
      ...(edgeFunctionsCommands.length > 0
        ? [
            {
              id: 'create-edge-functions',
              name: 'Edge Functions',
              commands: edgeFunctionsCommands,
            },
          ]
        : []),
      ...(storageCommands.length > 0
        ? [
            {
              id: 'create-storage',
              name: 'Storage',
              commands: storageCommands,
            },
          ]
        : []),
      ...(observabilityCommands.length > 0
        ? [
            {
              id: 'create-observability',
              name: 'Observability',
              commands: observabilityCommands,
            },
          ]
        : []),
      ...(integrationsCommands.length > 0
        ? [
            {
              id: 'create-integrations',
              name: 'Integrations',
              commands: integrationsCommands,
            },
          ]
        : []),
    ],
    [
      databaseCommands,
      authCommands,
      edgeFunctionsCommands,
      storageCommands,
      integrationsCommands,
      observabilityCommands,
    ]
  )

  useRegisterPage(
    CREATE_STUDIO_ENTITY,
    {
      type: PageType.Commands,
      sections,
    },
    {
      deps: [sections],
      enabled: enableCreateCommands,
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'create-studio-entity',
        name: 'Create...',
        action: () => setPage(CREATE_STUDIO_ENTITY),
        icon: () => <Plus />,
      },
    ],
    {
      ...options,
      orderSection: (sections) => sections,
      sectionMeta: { priority: 3 },
      enabled: enableCreateCommands,
    }
  )
}
