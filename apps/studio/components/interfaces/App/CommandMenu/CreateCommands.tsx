'use client'

import { useMemo } from 'react'
import { useFlag, useParams } from 'common'
import {
  BarChart3,
  Binary,
  Code2,
  FolderPlus,
  KeyRound,
  Layers,
  ListChecks,
  ListTree,
  LockKeyhole,
  Plus,
  Rows,
  Vault,
  ShieldPlus,
  Timer,
  UserCog,
  UserPlus,
  Webhook,
  Zap,
  Table2,
  Sparkles,
  MessageCircle,
  Mail,
  Lock,
} from 'lucide-react'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  PageType,
  type CommandOptions,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
  useSetCommandMenuOpen,
} from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { EdgeFunctions } from 'icons'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { extractMethod, isValidHook } from 'components/interfaces/Auth/Hooks/hooks.utils'
import { type Hook, HOOKS_DEFINITIONS } from 'components/interfaces/Auth/Hooks/hooks.constants'
import { AiIconAnimation, Badge } from 'ui'
import {
  useIsVectorBucketsEnabled,
  useIsAnalyticsBucketsEnabled,
} from 'data/config/project-storage-config-query'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'

const CREATE_STUDIO_ENTITY = 'Create Studio Entity'

export function useCreateCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const setPage = useSetPage()
  const setIsOpen = useSetCommandMenuOpen()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snap = useAiAssistantStateSnapshot()
  const authenticationOauth21 = useFlag('EnableOAuth21')

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

  const {
    data: authConfig,
    isError: isAuthConfigError,
    isPending: isAuthConfigLoading,
  } = useAuthConfigQuery({ projectRef: ref })

  const { getEntitlementSetValues: getEntitledHookSet } = useCheckEntitlements('auth.hooks')
  const entitledHookSet = getEntitledHookSet()

  const { nonAvailableHooks } = useMemo(() => {
    const allHooks: Hook[] = HOOKS_DEFINITIONS.map((definition) => ({
      ...definition,
      enabled: authConfig?.[definition.enabledKey] || false,
      method: extractMethod(
        authConfig?.[definition.uriKey] || '',
        authConfig?.[definition.secretsKey] || ''
      ),
    }))

    const nonAvailableHooks: string[] = allHooks
      .filter((h) => !isValidHook(h) && !entitledHookSet.includes(h.entitlementKey))
      .map((h) => h.entitlementKey)

    return { nonAvailableHooks }
  }, [entitledHookSet, authConfig])

  const showAuthConfig = !isAuthConfigError && !isAuthConfigLoading

  const sendSmsHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'send-sms')
  const sendEmailHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'send-email')
  const customAccessTokenHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'custom-access-token-claims'
  )
  const mfaVerificationHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'mfa-verification-attempt'
  )
  const mfaVerificationHookEnabled =
    showAuthConfig &&
    mfaVerificationHook &&
    nonAvailableHooks.includes(mfaVerificationHook.entitlementKey)
  const passwordVerificationHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'password-verification-attempt'
  )
  const passwordVerificationHookEnabled =
    showAuthConfig &&
    passwordVerificationHook &&
    nonAvailableHooks.includes(passwordVerificationHook.entitlementKey)
  const beforeUserCreatedHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'before-user-created')

  const authCommands = useMemo(
    () =>
      [
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
        authenticationOauth21
          ? {
              id: 'create-oauth-app',
              name: 'Create OAuth App',
              route: `/project/${ref}/auth/oauth-apps?new=true`,
              icon: () => <KeyRound />,
            }
          : null,
      ].filter(Boolean) as ICommand[],
    [ref]
  )

  const edgeFunctionsCommands = useMemo(
    () =>
      [
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
                    description: 'Create a new edge function that processes payments with Stripe',
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
            <AiIconAnimation allowHoverEffect={false} size={20} className="text-foreground-light" />
          ),
        },
        {
          id: 'create-edge-function-secret',
          name: 'Create Edge Function Secret',
          route: `/project/${ref}/functions/secrets`,
          icon: () => <LockKeyhole />,
        },
      ].filter(Boolean) as ICommand[],
    [ref, openSidebar, snap, setIsOpen]
  )

  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef: ref })
  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })

  const storageCommands = useMemo(
    () =>
      [
        {
          id: 'create-storage-bucket-files',
          name: 'Create Storage Bucket (Files)',
          route: `/project/${ref}/storage/files?new=true`,
          icon: () => <FolderPlus />,
        },
        {
          id: 'create-storage-bucket-analytics',
          name: 'Create Storage Bucket (Analytics)',
          route: `/project/${ref}/storage/analytics?new=true`,
          icon: () => <BarChart3 />,
          badge: () => (isAnalyticsBucketsEnabled ? <Badge>Pro</Badge> : null),
        },
        {
          id: 'create-storage-bucket-vectors',
          name: 'Create Storage Bucket (Vectors)',
          route: `/project/${ref}/storage/vectors?new=true`,
          icon: () => <Binary />,
          badge: () => (isVectorBucketsEnabled ? <Badge>Pro</Badge> : null),
        },
      ].filter(Boolean) as ICommand[],
    [ref]
  )

  const { installedIntegrations } = useInstalledIntegrations()

  const installedIntegrationIds = useMemo(
    () => new Set(installedIntegrations.map((integration) => integration.id)),
    [installedIntegrations]
  )

  const integrationsCommands = useMemo(
    () =>
      [
        installedIntegrationIds.has('vault')
          ? {
              id: 'create-vault-secret',
              name: 'Create Vault Secret',
              route: `/project/${ref}/integrations/vault/secrets?new=true`,
              icon: () => <Vault />,
            }
          : null,
        installedIntegrationIds.has('cron')
          ? {
              id: 'create-cron-job',
              name: 'Create Cron Job',
              route: `/project/${ref}/integrations/cron/jobs?new=true`,
              icon: () => <Timer />,
            }
          : null,
        installedIntegrationIds.has('webhooks')
          ? {
              id: 'create-webhook',
              name: 'Create Webhook',
              route: `/project/${ref}/integrations/webhooks/webhooks?new=true`,
              icon: () => <Webhook />,
            }
          : null,
        installedIntegrationIds.has('queues')
          ? {
              id: 'create-queue',
              name: 'Create Queue',
              route: `/project/${ref}/integrations/queues/queues?new=true`,
              icon: () => <ListTree />,
            }
          : null,
      ].filter(Boolean) as ICommand[],
    [ref, installedIntegrationIds]
  )

  useRegisterPage(
    CREATE_STUDIO_ENTITY,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'create-database',
          name: 'Database',
          commands: databaseCommands,
        },
        {
          id: 'create-auth',
          name: 'Auth',
          commands: authCommands,
        },
        {
          id: 'create-edge-functions',
          name: 'Edge Functions',
          commands: edgeFunctionsCommands,
        },
        {
          id: 'create-storage',
          name: 'Storage',
          commands: storageCommands,
        },
        {
          id: 'create-integrations',
          name: 'Integrations',
          commands: integrationsCommands,
        },
      ],
    },
    {
      deps: [
        databaseCommands,
        authCommands,
        edgeFunctionsCommands,
        storageCommands,
        integrationsCommands,
      ],
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
    }
  )
}
