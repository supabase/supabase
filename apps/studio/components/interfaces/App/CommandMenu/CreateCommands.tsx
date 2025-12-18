'use client'

import { useMemo } from 'react'
import { useParams } from 'common'
import {
  BarChart3,
  Binary,
  Code2,
  FolderPlus,
  KeyRound,
  Layers,
  Link2,
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

const CREATE_STUDIO_ENTITY = 'Create Studio Entity'

export function useCreateCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const setPage = useSetPage()
  const setIsOpen = useSetCommandMenuOpen()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snap = useAiAssistantStateSnapshot()

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
          id: 'create-auth-hook',
          name: 'Create Auth Hook',
          route: `/project/${ref}/auth/hooks?new=true`,
          icon: () => <Link2 />,
        },
        {
          id: 'create-oauth-app',
          name: 'Create OAuth App',
          route: `/project/${ref}/auth/oauth-apps?new=true`,
          icon: () => <KeyRound />,
        },
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
          icon: () => <Sparkles />,
        },
        {
          id: 'create-function-secret',
          name: 'Create Function Secret',
          route: `/project/${ref}/functions/secrets?new=true`,
          icon: () => <LockKeyhole />,
        },
      ].filter(Boolean) as ICommand[],
    [ref, openSidebar, snap, setIsOpen]
  )

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
        },
        {
          id: 'create-storage-bucket-vectors',
          name: 'Create Storage Bucket (Vectors)',
          route: `/project/${ref}/storage/vectors?new=true`,
          icon: () => <Binary />,
        },
      ].filter(Boolean) as ICommand[],
    [ref]
  )

  const integrationsCommands = useMemo(
    () =>
      [
        {
          id: 'create-vault-secret',
          name: 'Create Vault Secret',
          route: `/project/${ref}/integrations/vault?new=true`,
          icon: () => <Vault />,
        },
        {
          id: 'create-cron-job',
          name: 'Create Cron Job',
          route: `/project/${ref}/integrations/cron?new=true`,
          icon: () => <Timer />,
        },
        {
          id: 'create-webhook',
          name: 'Create Webhook',
          route: `/project/${ref}/integrations/webhooks?new=true`,
          icon: () => <Webhook />,
        },
        {
          id: 'create-queue',
          name: 'Create Queue',
          route: `/project/${ref}/integrations/queues?new=true`,
          icon: () => <ListTree />,
        },
        {
          id: 'create-wrapper',
          name: 'Create Wrapper',
          route: `/project/${ref}/integrations/wrappers?new=true`,
          icon: () => <Layers />,
        },
      ].filter(Boolean) as ICommand[],
    [ref]
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
