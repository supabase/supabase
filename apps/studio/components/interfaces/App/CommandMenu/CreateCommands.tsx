'use client'

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
  Rows,
  Vault,
  ShieldPlus,
  Timer,
  UserCog,
  UserPlus,
  Webhook,
  Zap,
} from 'lucide-react'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useCreateCommands() {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'create-db-function',
        name: 'Create Database Function',
        route: `/project/${ref}/database/functions?new=true`,
        defaultHidden: true,
        icon: () => <Code2 size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-db-enum',
        name: 'Create Database Enumerated Type',
        route: `/project/${ref}/database/types?new=true`,
        defaultHidden: true,
        icon: () => <ListChecks size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-db-trigger',
        name: 'Create Database Trigger',
        route: `/project/${ref}/database/triggers?new=true`,
        defaultHidden: true,
        icon: () => <Zap size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-db-index',
        name: 'Create Database Index',
        route: `/project/${ref}/database/indexes?new=true`,
        defaultHidden: true,
        icon: () => <Rows size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-db-role',
        name: 'Create Database Role',
        route: `/project/${ref}/database/roles?new=true`,
        defaultHidden: true,
        icon: () => <UserCog size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-auth-user',
        name: 'Invite Auth User',
        route: `/project/${ref}/auth/users?new=true`,
        defaultHidden: true,
        icon: () => <UserPlus size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-oauth-app',
        name: 'Create OAuth App',
        route: `/project/${ref}/auth/oauth-apps?new=true`,
        defaultHidden: true,
        icon: () => <KeyRound size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-auth-policy',
        name: 'Create Auth Policy',
        route: `/project/${ref}/auth/policies?new=true`,
        defaultHidden: true,
        icon: () => <ShieldPlus size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-auth-hook',
        name: 'Create Auth Hook',
        route: `/project/${ref}/auth/hooks?new=true`,
        defaultHidden: true,
        icon: () => <Link2 size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-api-key',
        name: 'Create API Key',
        route: `/project/${ref}/settings/api-keys?new=true`,
        defaultHidden: true,
        icon: () => <KeyRound size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-storage-bucket-files',
        name: 'Create Storage Bucket (Files)',
        route: `/project/${ref}/storage/files?new=true`,
        defaultHidden: true,
        icon: () => <FolderPlus size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-storage-bucket-analytics',
        name: 'Create Storage Bucket (Analytics)',
        route: `/project/${ref}/storage/analytics?new=true`,
        defaultHidden: true,
        icon: () => <BarChart3 size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-storage-bucket-vectors',
        name: 'Create Storage Bucket (Vectors)',
        route: `/project/${ref}/storage/vectors?new=true`,
        defaultHidden: true,
        icon: () => <Binary size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-function-secret',
        name: 'Create Function Secret',
        route: `/project/${ref}/functions/secrets?new=true`,
        defaultHidden: true,
        icon: () => <LockKeyhole size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-vault-secret',
        name: 'Create Vault Secret',
        route: `/project/${ref}/integrations/vault?new=true`,
        defaultHidden: true,
        icon: () => <Vault size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-cron-job',
        name: 'Create Cron Job',
        route: `/project/${ref}/integrations/cron?new=true`,
        defaultHidden: true,
        icon: () => <Timer size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-webhook',
        name: 'Create Webhook',
        route: `/project/${ref}/integrations/webhooks?new=true`,
        defaultHidden: true,
        icon: () => <Webhook size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-queue',
        name: 'Create Queue',
        route: `/project/${ref}/integrations/queues?new=true`,
        defaultHidden: true,
        icon: () => <ListTree size={16} strokeWidth={1.5} />,
      },
      {
        id: 'create-wrapper',
        name: 'Create Wrapper',
        route: `/project/${ref}/integrations/wrappers?new=true`,
        defaultHidden: true,
        icon: () => <Layers size={16} strokeWidth={1.5} />,
      },
    ],
    {
      deps: [ref],
      orderSection: (sections) => sections, // keep existing order; fallback to default ordering logic elsewhere
      sectionMeta: { priority: 3 },
    }
  )
}
