import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import {
  CalendarClock,
  Check,
  ChevronRight,
  ExternalLink,
  Eye,
  Shield,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Checkbox,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Form,
  FormControl,
  FormField,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  ToggleGroup,
  ToggleGroupItem,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  CUSTOM_EXPIRY_VALUE,
  EXPIRES_AT_OPTIONS,
  type ScopedAccessTokenPermission,
} from '../AccessToken.constants'
import { TokenSchema, type TokenFormValues } from '../AccessToken.schemas'
import { resolveExpiry } from '../AccessToken.utils'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { BasicInfo } from './Form/BasicInfo'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  useAccessTokenCreateMutation,
  type NewScopedAccessToken,
  type ScopedAccessTokenCreateVariables,
} from '@/data/scoped-access-tokens/scoped-access-token-create-mutation'
import { formatTzTimestamp } from '@/lib/datetime'
import { useTrack } from '@/lib/telemetry/track'

export interface NewScopedTokenSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  tokenScope: 'V0' | undefined
  onCreateToken: (token: NewScopedAccessToken) => void
}

export type AccessLevel = 'none' | 'read' | 'write'
type Boundary = TokenFormValues['resourceAccess']

export type Capability = {
  id: string
  label: string
  description: string
  readOnly?: boolean
  risk?: 'low' | 'warning' | 'destructive'
  /**
   * Short phrase for the "It cannot" preview, shown when this capability is not
   * granted. Only set on high-risk capabilities worth calling out.
   */
  cannot?: string
  allows: Record<Exclude<AccessLevel, 'none'>, string[]>
  tools: Record<Exclude<AccessLevel, 'none'>, string[]>
  apiDocs: Record<Exclude<AccessLevel, 'none'>, ApiEndpoint[]>
}

type ApiEndpoint = {
  operationId: string
  method: string
  path: string
  label: string
}

const fga = (...permissions: ScopedAccessTokenPermission[]) => permissions

const DEFAULT_CAPABILITY_ACCESS: Record<string, AccessLevel> = {
  organization: 'none',
  members: 'none',
  project: 'none',
  actionRuns: 'none',
  advisors: 'none',
  database: 'none',
  migrations: 'none',
  backups: 'none',
  edgeFunctions: 'none',
  storage: 'none',
  authConfig: 'none',
  domains: 'none',
  realtimeConfig: 'none',
  dataApiConfig: 'none',
  secrets: 'none',
  logsAnalytics: 'none',
  branches: 'none',
  infrastructure: 'none',
}

const DEFAULT_FORM_VALUES: TokenFormValues = {
  tokenName: '',
  expiresAt: EXPIRES_AT_OPTIONS['week'].value,
  customExpiryDate: undefined,
  resourceAccess: 'selected-projects',
  selectedOrganizations: [],
  selectedProjects: [],
  permissionRows: [],
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'organization',
    label: 'Organization',
    description: 'Organization settings and project list.',
    risk: 'destructive',
    cannot: 'Manage organization settings',
    allows: {
      read: ['Read organization settings', 'Read organization projects'],
      write: ['Manage organization settings', 'Read organization projects'],
    },
    tools: {
      read: ['list_organizations', 'get_organization'],
      write: ['list_organizations', 'get_organization'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-all-organizations',
          method: 'GET',
          path: '/v1/organizations',
          label: 'List organizations',
        },
        {
          operationId: 'v1-get-an-organization',
          method: 'GET',
          path: '/v1/organizations/{slug}',
          label: 'Get organization',
        },
        {
          operationId: 'v1-get-all-projects-for-organization',
          method: 'GET',
          path: '/v1/organizations/{slug}/projects',
          label: 'Get organization projects',
        },
      ],
      write: [
        {
          operationId: 'v1-get-an-organization',
          method: 'GET',
          path: '/v1/organizations/{slug}',
          label: 'Get organization',
        },
      ],
    },
  },
  {
    id: 'members',
    label: 'Members',
    description: 'Organization member and role access.',
    risk: 'destructive',
    cannot: 'Manage organization members',
    allows: {
      read: ['Read organization members', 'Read organization roles'],
      write: ['Manage organization members'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-organization-members',
          method: 'GET',
          path: '/v1/organizations/{slug}/members',
          label: 'List organization members',
        },
      ],
      write: [
        {
          operationId: 'v1-list-organization-members',
          method: 'GET',
          path: '/v1/organizations/{slug}/members',
          label: 'List organization members',
        },
      ],
    },
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Project metadata and settings.',
    risk: 'warning',
    allows: {
      read: ['Read project metadata', 'Read project settings'],
      write: ['Read project metadata', 'Manage project settings'],
    },
    tools: {
      read: ['get_project'],
      write: ['get_project', 'update_project'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-project',
          method: 'GET',
          path: '/v1/projects/{ref}',
          label: 'Get project',
        },
      ],
      write: [
        {
          operationId: 'v1-get-project',
          method: 'GET',
          path: '/v1/projects/{ref}',
          label: 'Get project',
        },
        {
          operationId: 'v1-update-a-project',
          method: 'PATCH',
          path: '/v1/projects/{ref}',
          label: 'Update project',
        },
      ],
    },
  },
  {
    id: 'actionRuns',
    label: 'Action Runs',
    description: 'Project action run status and logs.',
    risk: 'warning',
    allows: {
      read: ['Read action runs', 'Read action run logs'],
      write: ['Update action run status'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-action-runs',
          method: 'GET',
          path: '/v1/projects/{ref}/actions',
          label: 'List action runs',
        },
        {
          operationId: 'v1-get-action-run-logs',
          method: 'GET',
          path: '/v1/projects/{ref}/actions/{run_id}/logs',
          label: 'Get action run logs',
        },
      ],
      write: [
        {
          operationId: 'v1-list-action-runs',
          method: 'GET',
          path: '/v1/projects/{ref}/actions',
          label: 'List action runs',
        },
        {
          operationId: 'v1-update-action-run-status',
          method: 'PATCH',
          path: '/v1/projects/{ref}/actions/{run_id}/status',
          label: 'Update action run status',
        },
      ],
    },
  },
  {
    id: 'advisors',
    label: 'Advisors',
    description: 'Security and performance advisor results.',
    readOnly: true,
    risk: 'low',
    allows: {
      read: ['Read security advisors', 'Read performance advisors'],
      write: ['Read security advisors', 'Read performance advisors'],
    },
    tools: {
      read: ['get_advisors'],
      write: ['get_advisors'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-security-advisors',
          method: 'GET',
          path: '/v1/projects/{ref}/advisors/security',
          label: 'Get security advisors',
        },
        {
          operationId: 'v1-get-performance-advisors',
          method: 'GET',
          path: '/v1/projects/{ref}/advisors/performance',
          label: 'Get performance advisors',
        },
      ],
      write: [
        {
          operationId: 'v1-get-security-advisors',
          method: 'GET',
          path: '/v1/projects/{ref}/advisors/security',
          label: 'Get security advisors',
        },
        {
          operationId: 'v1-get-performance-advisors',
          method: 'GET',
          path: '/v1/projects/{ref}/advisors/performance',
          label: 'Get performance advisors',
        },
      ],
    },
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Database access and data operations.',
    risk: 'destructive',
    cannot: 'Run SQL',
    allows: {
      read: ['Read database metadata and data'],
      write: ['Read database data', 'Run write queries against the database'],
    },
    tools: {
      read: ['list_tables', 'execute_sql_read_only'],
      write: ['list_tables', 'execute_sql'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-database-metadata',
          method: 'GET',
          path: '/v1/projects/{ref}/database/context',
          label: 'Get database metadata',
        },
        {
          operationId: 'v1-read-only-query',
          method: 'POST',
          path: '/v1/projects/{ref}/database/query/read-only',
          label: 'Run read-only SQL',
        },
      ],
      write: [
        {
          operationId: 'v1-get-database-metadata',
          method: 'GET',
          path: '/v1/projects/{ref}/database/context',
          label: 'Get database metadata',
        },
        {
          operationId: 'v1-run-a-query',
          method: 'POST',
          path: '/v1/projects/{ref}/database/query',
          label: 'Run SQL query',
        },
      ],
    },
  },
  {
    id: 'migrations',
    label: 'Migrations',
    description: 'Database migration history and application.',
    allows: {
      read: ['Read database migration history'],
      write: ['Read migration history', 'Apply database migrations'],
    },
    tools: {
      read: ['list_migrations'],
      write: ['list_migrations', 'apply_migration'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-migration-history',
          method: 'GET',
          path: '/v1/projects/{ref}/database/migrations',
          label: 'List migration history',
        },
      ],
      write: [
        {
          operationId: 'v1-list-migration-history',
          method: 'GET',
          path: '/v1/projects/{ref}/database/migrations',
          label: 'List migration history',
        },
        {
          operationId: 'v1-apply-a-migration',
          method: 'POST',
          path: '/v1/projects/{ref}/database/migrations',
          label: 'Apply migration',
        },
      ],
    },
  },
  {
    id: 'backups',
    label: 'Backups',
    description: 'Database backups, restore points, and restore operations.',
    risk: 'destructive',
    cannot: 'Restore or manage backups',
    allows: {
      read: ['Read backups', 'Read restore points', 'Read backup schedule'],
      write: ['Create restore points', 'Restore backups', 'Update backup schedule'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-all-backups',
          method: 'GET',
          path: '/v1/projects/{ref}/database/backups',
          label: 'List backups',
        },
        {
          operationId: 'v1-get-restore-point',
          method: 'GET',
          path: '/v1/projects/{ref}/database/backups/restore-point',
          label: 'Get restore points',
        },
        {
          operationId: 'v1-get-backup-schedule',
          method: 'GET',
          path: '/v1/projects/{ref}/database/backups/schedule',
          label: 'Get backup schedule',
        },
      ],
      write: [
        {
          operationId: 'v1-list-all-backups',
          method: 'GET',
          path: '/v1/projects/{ref}/database/backups',
          label: 'List backups',
        },
        {
          operationId: 'v1-create-restore-point',
          method: 'POST',
          path: '/v1/projects/{ref}/database/backups/restore-point',
          label: 'Create restore point',
        },
        {
          operationId: 'v1-restore-pitr-backup',
          method: 'POST',
          path: '/v1/projects/{ref}/database/backups/restore-pitr',
          label: 'Restore PITR backup',
        },
      ],
    },
  },
  {
    id: 'edgeFunctions',
    label: 'Edge Functions',
    description: 'Function source, deployment, and metadata.',
    allows: {
      read: ['List functions', 'Read function body'],
      write: ['List functions', 'Read function body', 'Deploy functions'],
    },
    tools: {
      read: ['list_edge_functions', 'get_edge_function'],
      write: ['list_edge_functions', 'get_edge_function', 'deploy_edge_function'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-all-functions',
          method: 'GET',
          path: '/v1/projects/{ref}/functions',
          label: 'List functions',
        },
        {
          operationId: 'v1-get-a-function',
          method: 'GET',
          path: '/v1/projects/{ref}/functions/{function_slug}',
          label: 'Retrieve function',
        },
        {
          operationId: 'v1-get-a-function-body',
          method: 'GET',
          path: '/v1/projects/{ref}/functions/{function_slug}/body',
          label: 'Retrieve function body',
        },
      ],
      write: [
        {
          operationId: 'v1-list-all-functions',
          method: 'GET',
          path: '/v1/projects/{ref}/functions',
          label: 'List functions',
        },
        {
          operationId: 'v1-deploy-a-function',
          method: 'POST',
          path: '/v1/projects/{ref}/functions/deploy',
          label: 'Deploy function',
        },
        {
          operationId: 'v1-update-a-function',
          method: 'PATCH',
          path: '/v1/projects/{ref}/functions/{function_slug}',
          label: 'Update function',
        },
      ],
    },
  },
  {
    id: 'storage',
    label: 'Storage',
    description: 'Storage objects and bucket configuration.',
    allows: {
      read: ['Read Storage buckets and objects', 'Read Storage configuration'],
      write: ['Manage Storage buckets and objects', 'Manage Storage configuration'],
    },
    tools: {
      read: ['list_storage_buckets'],
      write: ['list_storage_buckets', 'create_storage_bucket', 'update_storage_config'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-all-buckets',
          method: 'GET',
          path: '/v1/projects/{ref}/storage/buckets',
          label: 'List buckets',
        },
        {
          operationId: 'v1-get-storage-config',
          method: 'GET',
          path: '/v1/projects/{ref}/config/storage',
          label: 'Get Storage config',
        },
      ],
      write: [
        {
          operationId: 'v1-list-all-buckets',
          method: 'GET',
          path: '/v1/projects/{ref}/storage/buckets',
          label: 'List buckets',
        },
        {
          operationId: 'v1-update-storage-config',
          method: 'PATCH',
          path: '/v1/projects/{ref}/config/storage',
          label: 'Update Storage config',
        },
      ],
    },
  },
  {
    id: 'authConfig',
    label: 'Auth Config',
    description: 'Authentication provider and signing settings.',
    risk: 'warning',
    allows: {
      read: ['Read Auth settings', 'Read signing key metadata'],
      write: ['Manage Auth settings', 'Manage signing keys'],
    },
    tools: {
      read: ['get_auth_config'],
      write: ['get_auth_config', 'update_auth_config'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-auth-service-config',
          method: 'GET',
          path: '/v1/projects/{ref}/config/auth',
          label: 'Get Auth config',
        },
        {
          operationId: 'v1-get-project-signing-keys',
          method: 'GET',
          path: '/v1/projects/{ref}/config/auth/signing-keys',
          label: 'List signing keys',
        },
      ],
      write: [
        {
          operationId: 'v1-get-auth-service-config',
          method: 'GET',
          path: '/v1/projects/{ref}/config/auth',
          label: 'Get Auth config',
        },
        {
          operationId: 'v1-update-auth-service-config',
          method: 'PATCH',
          path: '/v1/projects/{ref}/config/auth',
          label: 'Update Auth config',
        },
        {
          operationId: 'v1-create-project-signing-key',
          method: 'POST',
          path: '/v1/projects/{ref}/config/auth/signing-keys',
          label: 'Create signing key',
        },
      ],
    },
  },
  {
    id: 'domains',
    label: 'Domains',
    description: 'Custom hostnames and vanity subdomains.',
    risk: 'warning',
    allows: {
      read: ['Read custom hostname config', 'Read vanity subdomain config'],
      write: ['Manage custom hostnames', 'Manage vanity subdomains'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-hostname-config',
          method: 'GET',
          path: '/v1/projects/{ref}/custom-hostname',
          label: 'Get custom hostname config',
        },
        {
          operationId: 'v1-get-vanity-subdomain-config',
          method: 'GET',
          path: '/v1/projects/{ref}/vanity-subdomain',
          label: 'Get vanity subdomain config',
        },
      ],
      write: [
        {
          operationId: 'v1-get-hostname-config',
          method: 'GET',
          path: '/v1/projects/{ref}/custom-hostname',
          label: 'Get custom hostname config',
        },
        {
          operationId: 'v1-update-hostname-config',
          method: 'POST',
          path: '/v1/projects/{ref}/custom-hostname/initialize',
          label: 'Initialize custom hostname',
        },
        {
          operationId: 'v1-activate-vanity-subdomain-config',
          method: 'POST',
          path: '/v1/projects/{ref}/vanity-subdomain/activate',
          label: 'Activate vanity subdomain',
        },
      ],
    },
  },
  {
    id: 'realtimeConfig',
    label: 'Realtime Config',
    description: 'Realtime configuration and connection shutdown.',
    risk: 'warning',
    allows: {
      read: ['Read Realtime configuration'],
      write: ['Manage Realtime configuration', 'Shutdown Realtime connections'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-realtime-config',
          method: 'GET',
          path: '/v1/projects/{ref}/config/realtime',
          label: 'Get Realtime config',
        },
      ],
      write: [
        {
          operationId: 'v1-get-realtime-config',
          method: 'GET',
          path: '/v1/projects/{ref}/config/realtime',
          label: 'Get Realtime config',
        },
        {
          operationId: 'v1-update-realtime-config',
          method: 'PATCH',
          path: '/v1/projects/{ref}/config/realtime',
          label: 'Update Realtime config',
        },
        {
          operationId: 'v1-shutdown-realtime',
          method: 'POST',
          path: '/v1/projects/{ref}/config/realtime/shutdown',
          label: 'Shutdown Realtime',
        },
      ],
    },
  },
  {
    id: 'dataApiConfig',
    label: 'Data API Config',
    description: 'PostgREST behavior and generated OpenAPI spec.',
    risk: 'warning',
    allows: {
      read: ['Read Data API configuration'],
      write: ['Manage Data API configuration'],
    },
    tools: {
      read: [],
      write: [],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-postgrest-service-config',
          method: 'GET',
          path: '/v1/projects/{ref}/postgrest',
          label: 'Get PostgREST config',
        },
        {
          operationId: 'v1-get-database-openapi',
          method: 'GET',
          path: '/v1/projects/{ref}/database/openapi',
          label: 'Get database OpenAPI spec',
        },
      ],
      write: [
        {
          operationId: 'v1-get-postgrest-service-config',
          method: 'GET',
          path: '/v1/projects/{ref}/postgrest',
          label: 'Get PostgREST config',
        },
        {
          operationId: 'v1-update-postgrest-service-config',
          method: 'PATCH',
          path: '/v1/projects/{ref}/postgrest',
          label: 'Update PostgREST config',
        },
      ],
    },
  },
  {
    id: 'secrets',
    label: 'API Keys & Secrets',
    description: 'Project API keys and function secrets.',
    risk: 'destructive',
    cannot: 'Read API keys or function secrets',
    allows: {
      read: ['Read project API keys', 'Read function secrets'],
      write: ['Manage project API keys', 'Manage function secrets'],
    },
    tools: {
      read: ['list_api_keys', 'list_edge_function_secrets'],
      write: ['list_api_keys', 'update_api_key', 'update_edge_function_secret'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-project-api-keys',
          method: 'GET',
          path: '/v1/projects/{ref}/api-keys',
          label: 'Get project API keys',
        },
        {
          operationId: 'v1-list-all-secrets',
          method: 'GET',
          path: '/v1/projects/{ref}/secrets',
          label: 'List function secrets',
        },
      ],
      write: [
        {
          operationId: 'v1-get-project-api-keys',
          method: 'GET',
          path: '/v1/projects/{ref}/api-keys',
          label: 'Get project API keys',
        },
        {
          operationId: 'v1-create-project-api-key',
          method: 'POST',
          path: '/v1/projects/{ref}/api-keys',
          label: 'Create project API key',
        },
        {
          operationId: 'v1-bulk-create-secrets',
          method: 'POST',
          path: '/v1/projects/{ref}/secrets',
          label: 'Bulk create function secrets',
        },
      ],
    },
  },
  {
    id: 'logsAnalytics',
    label: 'Logs & Analytics',
    description: 'Operational logs, usage, and analytics.',
    readOnly: true,
    allows: {
      read: ['Read project logs', 'Read usage analytics'],
      write: ['Read project logs', 'Read usage analytics'],
    },
    tools: {
      read: ['get_logs', 'get_usage'],
      write: ['get_logs', 'get_usage'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-project-logs',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/logs.all',
          label: 'Get project logs',
        },
        {
          operationId: 'v1-get-project-usage-api-count',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/usage.api-counts',
          label: 'Get API usage counts',
        },
        {
          operationId: 'v1-get-project-function-combined-stats',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/functions.combined-stats',
          label: 'Get function stats',
        },
      ],
      write: [
        {
          operationId: 'v1-get-project-logs',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/logs.all',
          label: 'Get project logs',
        },
        {
          operationId: 'v1-get-project-usage-api-count',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/usage.api-counts',
          label: 'Get API usage counts',
        },
        {
          operationId: 'v1-get-project-function-combined-stats',
          method: 'GET',
          path: '/v1/projects/{ref}/analytics/endpoints/functions.combined-stats',
          label: 'Get function stats',
        },
      ],
    },
  },
  {
    id: 'branches',
    label: 'Branches',
    description: 'Development and production branch automation.',
    risk: 'low',
    allows: {
      read: ['Read development branches', 'Read production branches'],
      write: ['Manage development branches', 'Manage production branches'],
    },
    tools: {
      read: ['list_branches'],
      write: ['list_branches', 'create_branch', 'update_branch'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-list-all-branches',
          method: 'GET',
          path: '/v1/projects/{ref}/branches',
          label: 'List branches',
        },
        {
          operationId: 'v1-get-a-branch',
          method: 'GET',
          path: '/v1/projects/{ref}/branches/{name}',
          label: 'Get branch',
        },
      ],
      write: [
        {
          operationId: 'v1-list-all-branches',
          method: 'GET',
          path: '/v1/projects/{ref}/branches',
          label: 'List branches',
        },
        {
          operationId: 'v1-create-a-branch',
          method: 'POST',
          path: '/v1/projects/{ref}/branches',
          label: 'Create branch',
        },
        {
          operationId: 'v1-update-a-branch-config',
          method: 'PATCH',
          path: '/v1/branches/{branch_id_or_ref}',
          label: 'Update branch config',
        },
      ],
    },
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Disk, replicas, and infrastructure add-ons.',
    risk: 'destructive',
    cannot: 'Change billing or infrastructure',
    allows: {
      read: ['Read infrastructure configuration'],
      write: ['Manage disk, replicas, and infrastructure add-ons'],
    },
    tools: {
      read: ['get_infrastructure_config'],
      write: ['get_infrastructure_config', 'update_infrastructure_config'],
    },
    apiDocs: {
      read: [
        {
          operationId: 'v1-get-database-disk',
          method: 'GET',
          path: '/v1/projects/{ref}/config/disk',
          label: 'Get database disk',
        },
        {
          operationId: 'v1-list-project-addons',
          method: 'GET',
          path: '/v1/projects/{ref}/billing/addons',
          label: 'List project add-ons',
        },
      ],
      write: [
        {
          operationId: 'v1-get-database-disk',
          method: 'GET',
          path: '/v1/projects/{ref}/config/disk',
          label: 'Get database disk',
        },
        {
          operationId: 'v1-modify-database-disk',
          method: 'POST',
          path: '/v1/projects/{ref}/config/disk',
          label: 'Modify database disk',
        },
        {
          operationId: 'v1-apply-project-addon',
          method: 'PATCH',
          path: '/v1/projects/{ref}/billing/addons',
          label: 'Apply project add-on',
        },
      ],
    },
  },
]

const CAPABILITY_PERMISSION_CATALOG: Record<
  string,
  Record<Exclude<AccessLevel, 'none'>, ScopedAccessTokenPermission[]>
> = {
  organization: {
    read: fga('organization_admin_read', 'organization_projects_read'),
    write: fga(
      'organization_admin_read',
      'organization_admin_write',
      'organization_projects_read',
      'organization_projects_create'
    ),
  },
  members: {
    read: fga('members_read'),
    write: fga('members_read', 'members_write'),
  },
  project: {
    read: fga('project_admin_read'),
    write: fga('project_admin_read', 'project_admin_write'),
  },
  actionRuns: {
    read: fga('action_runs_read'),
    write: fga('action_runs_read', 'action_runs_write'),
  },
  advisors: {
    read: fga('advisors_read'),
    write: fga('advisors_read'),
  },
  database: {
    read: fga('database_read'),
    write: fga('database_read', 'database_write'),
  },
  migrations: {
    read: fga('database_migrations_read'),
    write: fga('database_migrations_read', 'database_migrations_write'),
  },
  backups: {
    read: fga('backups_read'),
    write: fga('backups_read', 'backups_write'),
  },
  edgeFunctions: {
    read: fga('edge_functions_read'),
    write: fga('edge_functions_read', 'edge_functions_write'),
  },
  storage: {
    read: fga('storage_read', 'storage_config_read'),
    write: fga('storage_read', 'storage_write', 'storage_config_read', 'storage_config_write'),
  },
  authConfig: {
    read: fga('auth_config_read', 'auth_signing_keys_read'),
    write: fga(
      'auth_config_read',
      'auth_config_write',
      'auth_signing_keys_read',
      'auth_signing_keys_write'
    ),
  },
  domains: {
    read: fga('custom_domain_read', 'vanity_subdomain_read'),
    write: fga(
      'custom_domain_read',
      'custom_domain_write',
      'vanity_subdomain_read',
      'vanity_subdomain_write'
    ),
  },
  realtimeConfig: {
    read: fga('realtime_config_read'),
    write: fga('realtime_config_read', 'realtime_config_write'),
  },
  dataApiConfig: {
    read: fga('data_api_config_read'),
    write: fga('data_api_config_read', 'data_api_config_write'),
  },
  secrets: {
    read: fga('api_gateway_keys_read', 'edge_functions_secrets_read'),
    write: fga(
      'api_gateway_keys_read',
      'api_gateway_keys_write',
      'edge_functions_secrets_read',
      'edge_functions_secrets_write'
    ),
  },
  logsAnalytics: {
    read: fga('analytics_logs_read', 'analytics_usage_read'),
    write: fga('analytics_logs_read', 'analytics_usage_read'),
  },
  branches: {
    read: fga('branching_development_read', 'branching_production_read'),
    write: fga(
      'branching_development_read',
      'branching_development_write',
      'branching_development_create',
      'branching_development_delete',
      'branching_production_read',
      'branching_production_write',
      'branching_production_create',
      'branching_production_delete'
    ),
  },
  infrastructure: {
    read: fga('infra_add_ons_read', 'infra_disk_config_read', 'infra_read_replicas_read'),
    write: fga(
      'infra_add_ons_read',
      'infra_add_ons_write',
      'infra_disk_config_read',
      'infra_disk_config_write',
      'infra_read_replicas_read',
      'infra_read_replicas_write'
    ),
  },
}

const CAPABILITY_GROUPS = [
  {
    id: 'project-basics',
    label: 'Project basics',
    description: 'Core project visibility, operational status, and diagnostics.',
    capabilityIds: ['project', 'actionRuns', 'advisors', 'logsAnalytics'],
    defaultOpen: true,
  },
  {
    id: 'database',
    label: 'Database',
    description: 'SQL access, migrations, backups, and Data API configuration.',
    capabilityIds: ['database', 'migrations', 'backups', 'dataApiConfig'],
    defaultOpen: true,
  },
  {
    id: 'application-services',
    label: 'Application services',
    description: 'Functions, Storage, Auth, Realtime, API keys, and secrets.',
    capabilityIds: ['edgeFunctions', 'storage', 'authConfig', 'realtimeConfig', 'secrets'],
    defaultOpen: true,
  },
  {
    id: 'infrastructure-delivery',
    label: 'Infrastructure & delivery',
    description: 'Branch automation, domains, disk, replicas, and add-ons.',
    capabilityIds: ['branches', 'domains', 'infrastructure'],
    defaultOpen: false,
  },
  {
    id: 'organization',
    label: 'Organization',
    description: 'Organization settings, project inventory, members, and roles.',
    capabilityIds: ['organization', 'members'],
    defaultOpen: false,
  },
] as const

const CAPABILITIES_BY_ID = new Map(CAPABILITIES.map((capability) => [capability.id, capability]))

const getAvailableCapabilityGroups = (resourceAccess: Boundary) => {
  return CAPABILITY_GROUPS.filter(
    (group) => resourceAccess !== 'selected-projects' || group.id !== 'organization'
  )
}

const BOUNDARY_OPTIONS: Array<{
  value: Boundary
  label: string
  description: string
  recommended?: boolean
  advanced?: boolean
}> = [
  {
    value: 'selected-projects',
    label: 'Single project',
    description: 'Access one project only.',
    recommended: true,
  },
  {
    value: 'selected-orgs',
    label: 'Organization',
    description: 'Access projects in one organization.',
  },
  {
    value: 'all-orgs',
    label: 'Account-level',
    description: 'Access every organization and project you can access.',
    advanced: true,
  },
]

const EXPIRY_OPTIONS = [
  EXPIRES_AT_OPTIONS.day,
  EXPIRES_AT_OPTIONS.week,
  EXPIRES_AT_OPTIONS.month,
  EXPIRES_AT_OPTIONS.quarter,
  EXPIRES_AT_OPTIONS.custom,
] as const

const Eyebrow = ({ children }: { children: string }) => (
  <p className="text-[11px] font-normal uppercase tracking-[0.06em] text-foreground-lighter">
    {children}
  </p>
)

const SectionTitle = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) => (
  <div className="space-y-1">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h3 className="text-sm font-medium text-foreground">{title}</h3>
    {description && <p className="text-sm text-foreground-light">{description}</p>}
  </div>
)

const FieldError = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 text-sm text-destructive">
    <TriangleAlert size={14} className="shrink-0" />
    <span>{message}</span>
  </div>
)

const getCapabilityAccessConfig = (
  capability: Capability,
  level: Exclude<AccessLevel, 'none'>
) => ({
  permissions: CAPABILITY_PERMISSION_CATALOG[capability.id][level],
  endpoints: capability.apiDocs[level],
  mcpTools: capability.tools[level],
  allows: capability.allows[level],
})

/**
 * Resolves a capability's access level from a token's granted permissions
 * (the inverse of CAPABILITY_PERMISSION_CATALOG). `write` requires the full
 * write permission set, `read` the full read set; otherwise `none`.
 */
export const getCapabilityAccessLevel = (
  capabilityId: string,
  permissions: readonly string[] | null | undefined
): AccessLevel => {
  const config = CAPABILITY_PERMISSION_CATALOG[capabilityId]
  if (!config) return 'none'
  const granted = new Set(permissions ?? [])
  if (config.write.length > 0 && config.write.every((permission) => granted.has(permission))) {
    return 'write'
  }
  if (config.read.length > 0 && config.read.every((permission) => granted.has(permission))) {
    return 'read'
  }
  return 'none'
}

const getGeneratedPermissions = (access: Record<string, AccessLevel>) => {
  const permissions = getCapabilitySummary(access).flatMap(({ capability, level }) => {
    if (level === 'none') return []
    return getCapabilityAccessConfig(capability, level).permissions
  })

  return Array.from(new Set(permissions))
}

const getCapabilitySummary = (access: Record<string, AccessLevel>) => {
  return CAPABILITIES.filter((capability) => access[capability.id] !== 'none').map(
    (capability) => ({
      capability,
      level: access[capability.id] ?? 'none',
    })
  )
}

const getCapabilityGroupSummary = (
  capabilityIds: readonly string[],
  access: Record<string, AccessLevel>
) => {
  const selectedCapabilities = capabilityIds
    .map((id) => {
      const capability = CAPABILITIES_BY_ID.get(id)
      const level = access[id] ?? 'none'

      if (!capability || level === 'none') return undefined

      return { capability, level }
    })
    .filter(Boolean) as Array<{ capability: Capability; level: AccessLevel }>

  if (selectedCapabilities.length === 0) return 'No access'

  if (selectedCapabilities.length === 1) {
    const [{ capability, level }] = selectedCapabilities
    return `${capability.label}: ${level === 'write' ? 'Write' : 'Read'}`
  }

  return `${selectedCapabilities.length} selected`
}

type RiskTone = 'destructive' | 'warning' | 'brand' | 'none'

const RISK_TONE_DOT: Record<RiskTone, string> = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  brand: 'bg-brand',
  none: 'bg-foreground-muted',
}

const getRiskLevel = (
  enabled: ReturnType<typeof getCapabilitySummary>
): { label: string; tone: RiskTone } => {
  if (
    enabled.some(({ capability, level }) => level === 'write' && capability.risk === 'destructive')
  ) {
    return { label: 'High-risk write access', tone: 'destructive' }
  }
  if (enabled.some(({ capability, level }) => level === 'write' && capability.risk === 'warning')) {
    return { label: 'Medium-risk write access', tone: 'warning' }
  }
  if (enabled.some(({ level }) => level === 'write')) {
    return { label: 'Write access', tone: 'brand' }
  }
  if (enabled.length > 0) {
    return { label: 'Read-only access', tone: 'brand' }
  }
  return { label: 'No capabilities selected', tone: 'none' }
}

/**
 * Builds the "It cannot" preview. Derived from the catalog (not a hardcoded
 * list) so it stays complete: the resource boundary limits, plus every
 * destructive capability the token was not granted.
 */
const getCannotList = (access: Record<string, AccessLevel>, resourceAccess: Boundary): string[] => {
  const cannot: string[] = []

  if (resourceAccess === 'selected-projects') {
    cannot.push('Access other projects')
  } else if (resourceAccess === 'selected-orgs') {
    cannot.push('Access projects in other organizations')
  }

  CAPABILITIES.forEach((capability) => {
    if (capability.risk !== 'destructive' || !capability.cannot) return
    if ((access[capability.id] ?? 'none') === 'none') {
      cannot.push(capability.cannot)
    }
  })

  return cannot
}

const RISK_META: Record<NonNullable<Capability['risk']>, { dot: string; label: string }> = {
  destructive: { dot: 'bg-destructive', label: 'High risk' },
  warning: { dot: 'bg-warning', label: 'Medium risk' },
  low: { dot: 'bg-brand', label: 'Low risk' },
}

const CapabilityRisk = ({ risk, level }: { risk: Capability['risk']; level: AccessLevel }) => {
  // Keep the default (nothing granted) state calm: high-risk capabilities only
  // surface their dot once actually granted.
  if (!risk || (risk === 'destructive' && level === 'none')) return null
  const meta = RISK_META[risk]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-normal text-foreground-light">
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}

const getProjectOrganizationSlug = (project: unknown) => {
  if (!project || typeof project !== 'object') return undefined

  const maybeProject = project as {
    organization_slug?: string
    organization?: { slug?: string } | null
  }

  return maybeProject.organization_slug || maybeProject.organization?.slug
}

export const getApiDocsUrl = (operationId: string) => {
  return `https://supabase.com/docs/reference/api/${operationId}`
}

/**
 * Access-level tag for a granted capability. Read is brand-green; write is shown
 * as "Read + Write" (read in brand, write in warning) since write includes read.
 */
export const AccessLevelTag = ({
  level,
  className,
}: {
  level: Exclude<AccessLevel, 'none'>
  className?: string
}) => (
  <span className={cn('text-[10px] uppercase tracking-[0.04em]', className)}>
    <span className="text-brand">Read</span>
    {level === 'write' && (
      <>
        <span className="text-foreground-lighter"> + </span>
        <span className="text-warning">Write</span>
      </>
    )}
  </span>
)

export const NewScopedTokenSheet = ({
  visible,
  onOpenChange,
  tokenScope,
  onCreateToken,
}: NewScopedTokenSheetProps) => {
  const [capabilityAccess, setCapabilityAccess] =
    useState<Record<string, AccessLevel>>(DEFAULT_CAPABILITY_ACCESS)
  const [isReviewing, setIsReviewing] = useState(false)
  const [customDate, setCustomDate] = useState<Date>()
  const [accountLevelConfirmed, setAccountLevelConfirmed] = useState(false)
  // Turns on after the first Review/Generate attempt, then errors live-update
  // as the user fills things in.
  const [showValidation, setShowValidation] = useState(false)
  const { organizations, projects } = useOrgAndProjectData()

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  })
  const track = useTrack()
  const { mutate: createAccessToken, isPending } = useAccessTokenCreateMutation()

  const resourceAccess = form.watch('resourceAccess')
  const expiresAt = form.watch('expiresAt')
  const selectedOrganizations = form.watch('selectedOrganizations') || []
  const selectedProjects = form.watch('selectedProjects') || []
  const tokenName = form.watch('tokenName')

  const capabilitySummary = useMemo(
    () => getCapabilitySummary(capabilityAccess),
    [capabilityAccess]
  )
  const risk = useMemo(() => getRiskLevel(capabilitySummary), [capabilitySummary])
  const visibleCapabilityGroups = useMemo(
    () => getAvailableCapabilityGroups(resourceAccess),
    [resourceAccess]
  )

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        ref: project.ref,
        name: project.name,
        organizationSlug: getProjectOrganizationSlug(project),
      })),
    [projects]
  )

  const filteredProjectOptions =
    selectedOrganizations.length > 0
      ? projectOptions.filter(
          (project) =>
            !project.organizationSlug || selectedOrganizations.includes(project.organizationSlug)
        )
      : projectOptions

  const selectedProjectName =
    projectOptions.find((project) => selectedProjects.includes(project.ref))?.name ||
    selectedProjects[0]
  const selectedOrgName =
    organizations.find((org) => selectedOrganizations.includes(org.slug))?.name ||
    selectedOrganizations[0]

  const resourceSelection: { type: string; name: string } | null =
    resourceAccess === 'all-orgs'
      ? { type: 'Account', name: 'Account-level access' }
      : resourceAccess === 'selected-orgs'
        ? selectedOrgName
          ? { type: 'Organization', name: selectedOrgName }
          : null
        : selectedProjectName
          ? { type: 'Project', name: selectedProjectName }
          : null

  const boundarySummary = resourceSelection
    ? `${resourceSelection.type}: ${resourceSelection.name}`
    : 'No resource selected'

  const enabledTools = useMemo(
    () =>
      Array.from(
        new Set(
          capabilitySummary.flatMap(({ capability, level }) =>
            level === 'none' ? [] : getCapabilityAccessConfig(capability, level).mcpTools
          )
        )
      ),
    [capabilitySummary]
  )

  const boundaryCanItem =
    resourceAccess === 'selected-projects' && selectedProjectName
      ? `Access project ${selectedProjectName} only`
      : resourceAccess === 'selected-orgs' && selectedOrgName
        ? `Access organization ${selectedOrgName}`
        : resourceAccess === 'all-orgs'
          ? 'Access account-level resources'
          : undefined

  const canList = useMemo(
    () => [
      ...(boundaryCanItem ? [boundaryCanItem] : []),
      ...capabilitySummary.flatMap(({ capability, level }) =>
        level === 'none' ? [] : getCapabilityAccessConfig(capability, level).allows
      ),
    ],
    [boundaryCanItem, capabilitySummary]
  )

  const cannotList = useMemo(
    () => getCannotList(capabilityAccess, resourceAccess),
    [capabilityAccess, resourceAccess]
  )

  // Requirements not covered by the zod schema (resource selection, capabilities,
  // and account-level acknowledgement). Surfaced inline once showValidation is on.
  const resourceMissing = resourceSelection === null
  const capabilityMissing = capabilitySummary.length === 0
  const accountUnconfirmed = resourceAccess === 'all-orgs' && !accountLevelConfirmed
  const resourceErrorMessage =
    resourceAccess === 'selected-orgs'
      ? 'Please select an organization to continue.'
      : 'Please select a project to continue.'

  const updateCapability = (capabilityId: string, level: AccessLevel) => {
    // Read-only capabilities can't be set to write (the toggle hides Write for
    // them); guard defensively so the state never holds an invalid level.
    const capability = CAPABILITIES_BY_ID.get(capabilityId)
    const nextLevel = capability?.readOnly && level === 'write' ? 'read' : level
    setCapabilityAccess((prev) => ({ ...prev, [capabilityId]: nextLevel }))
    setIsReviewing(false)
  }

  const clearOrganizationCapabilities = () => {
    if (capabilityAccess.organization === 'none' && capabilityAccess.members === 'none') return

    setCapabilityAccess((prev) => ({ ...prev, organization: 'none', members: 'none' }))
    setIsReviewing(false)
  }

  // Guards against selecting a resource the user can't actually access. These are
  // rare error-class cases (stale data / tampering), so a toast is appropriate.
  const validateAccess = (values: TokenFormValues) => {
    if (values.resourceAccess === 'selected-orgs') {
      const availableOrgSlugs = organizations.map((org) => org.slug)
      const invalidOrgs = (values.selectedOrganizations || []).filter(
        (slug) => !availableOrgSlugs.includes(slug)
      )

      if (invalidOrgs.length > 0) {
        toast.error(
          `You don't have access to the following organization(s): ${invalidOrgs.join(', ')}`
        )
        return false
      }
    }

    if (values.resourceAccess === 'selected-projects') {
      const availableProjectRefs = projects.map((project) => project.ref)
      const invalidProjects = (values.selectedProjects || []).filter(
        (ref) => !availableProjectRefs.includes(ref)
      )

      if (invalidProjects.length > 0) {
        toast.error(
          `You don't have access to the following project(s): ${invalidProjects.join(', ')}`
        )
        return false
      }
    }

    return true
  }

  // Required-field checks (resource, capability, account-level) are surfaced
  // inline rather than via toast — flip showValidation on and let the inline
  // messages render. Returns false if any requirement is unmet.
  const ensureRequirementsMet = (values: TokenFormValues) => {
    setShowValidation(true)
    if (resourceMissing || capabilityMissing || accountUnconfirmed) return false
    return validateAccess(values)
  }

  const buildPayload = (values: TokenFormValues) => {
    const finalExpiresAt = resolveExpiry(values.expiresAt, values.customExpiryDate)

    const permissions = getGeneratedPermissions(capabilityAccess)

    const finalPayload: ScopedAccessTokenCreateVariables = {
      name: values.tokenName,
      permissions,
    }

    if (finalExpiresAt) {
      finalPayload.expires_at = finalExpiresAt
    }

    if (
      values.resourceAccess === 'selected-orgs' &&
      values.selectedOrganizations &&
      values.selectedOrganizations.length > 0
    ) {
      finalPayload.organization_slugs = values.selectedOrganizations
    } else if (
      values.resourceAccess === 'selected-projects' &&
      values.selectedProjects &&
      values.selectedProjects.length > 0
    ) {
      finalPayload.project_refs = values.selectedProjects
    }

    return { finalPayload, permissions }
  }

  const onSubmit: SubmitHandler<TokenFormValues> = async (values) => {
    if (!ensureRequirementsMet(values)) return

    const { finalPayload, permissions } = buildPayload(values)

    createAccessToken(finalPayload, {
      onSuccess: (data) => {
        track('access_token_created', {
          tokenType: 'scoped',
          expiryPreset: values.expiresAt || 'never',
          resourceAccess: values.resourceAccess,
          permissionCount: permissions.length,
        })
        toast.success('Access token created successfully')
        onCreateToken(data)
        handleClose()
      },
      onError: (error) => {
        if (error.message && error.message.includes("don't have access")) {
          toast.error(
            `Access Error: ${error.message}. Please verify you have access to the selected resources.`
          )
        } else {
          toast.error(`Failed to create access token: ${error.message}`)
        }
      },
    })
  }

  const resetFormState = () => {
    setCapabilityAccess(DEFAULT_CAPABILITY_ACCESS)
    setIsReviewing(false)
    setCustomDate(undefined)
    setAccountLevelConfirmed(false)
    setShowValidation(false)
    form.reset(DEFAULT_FORM_VALUES)
  }

  const handleClose = () => {
    resetFormState()
    onOpenChange(false)
  }

  const handleReview = form.handleSubmit(
    (values) => {
      if (ensureRequirementsMet(values)) setIsReviewing(true)
    },
    // Schema-invalid (e.g. missing name/expiry) — still surface the inline
    // section errors alongside the field errors react-hook-form renders.
    () => setShowValidation(true)
  )

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          onOpenChange(open)
        }
      }}
    >
      <SheetContent
        showClose={false}
        size="default"
        className="w-screen! max-w-[95vw]! xl:w-[1120px]! flex flex-col h-full gap-0"
      >
        <SheetHeader>
          <SheetTitle className="font-medium">
            {tokenScope === 'V0' ? 'Generate token for experimental API' : 'Generate new token'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            A form to generate a new scoped access token.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
          <div className="flex flex-col overflow-visible">
            {tokenScope === 'V0' && (
              <div className="px-4 sm:px-5 py-4 pb-4">
                <Admonition
                  type="warning"
                  title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
                  description={
                    <>
                      <p>
                        These include deleting organizations and projects which cannot be undone. Be
                        careful when using this API.
                      </p>
                      <div className="mt-4">
                        <Button asChild variant="default" icon={<ExternalLink />}>
                          <Link
                            href="https://api.supabase.com/api/v0"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Experimental API documentation
                          </Link>
                        </Button>
                      </div>
                    </>
                  }
                />
              </div>
            )}

            <Form {...form}>
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-0 overflow-visible">
                <div className="min-w-0 border-b xl:border-b-0 xl:border-r">
                  {isReviewing ? (
                    <div className="space-y-6 px-5 sm:px-6 py-6">
                      <SectionTitle
                        eyebrow="Review access"
                        title="Confirm this token before generating it"
                        description="The token value will be shown once after it is generated."
                      />
                      <div className="rounded-md border overflow-hidden">
                        <ReviewRow label="Name" value={tokenName || 'Untitled token'} />
                        <ReviewRow label="Resource access" value={boundarySummary} />
                        <ReviewRow
                          label="Capabilities"
                          value={
                            capabilitySummary.length === 0
                              ? 'None'
                              : capabilitySummary
                                  .map(({ capability, level }) => `${capability.label} ${level}`)
                                  .join(', ')
                          }
                        />
                        <ReviewRow
                          label="Expires"
                          value={dayjs(
                            resolveExpiry(expiresAt, form.getValues('customExpiryDate'))
                          ).format('MMM D, YYYY')}
                        />
                        <ReviewRow label="Risk level" value={risk.label} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <BasicInfo control={form.control} />
                      <Separator />

                      <section className="space-y-4 px-5 sm:px-6 py-6">
                        <SectionTitle
                          eyebrow="Resource access"
                          title="Where can it work?"
                          description="Set the resource access before choosing what the token can do."
                        />
                        <FormField
                          name="resourceAccess"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout name="resourceAccess" label="Resource access">
                              <FormControl>
                                <RadioGroup
                                  value={field.value}
                                  onValueChange={(value: Boundary) => {
                                    field.onChange(value)
                                    if (value === 'selected-projects') {
                                      clearOrganizationCapabilities()
                                    }
                                    form.setValue('selectedOrganizations', [], {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                    form.setValue('selectedProjects', [], {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                    setAccountLevelConfirmed(false)
                                    setIsReviewing(false)
                                  }}
                                  className="grid grid-cols-3 gap-2"
                                >
                                  {BOUNDARY_OPTIONS.map((option) => (
                                    <label
                                      key={option.value}
                                      className={cn(
                                        'flex min-w-0 cursor-pointer gap-3 rounded-md border p-3 transition-colors hover:bg-surface-100',
                                        field.value === option.value &&
                                          'border-stronger bg-surface-100',
                                        option.advanced && 'border-warning/40'
                                      )}
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        className="mt-0.5 shrink-0"
                                      />
                                      <span className="min-w-0 space-y-2">
                                        <span className="block text-sm font-medium leading-5 text-foreground">
                                          {option.label}
                                        </span>
                                        {(option.recommended || option.advanced) && (
                                          <span className="flex min-w-0 flex-wrap gap-1">
                                            {option.recommended && (
                                              <Badge variant="success" className="max-w-full">
                                                Recommended
                                              </Badge>
                                            )}
                                            {option.advanced && (
                                              <Badge variant="warning" className="max-w-full">
                                                Advanced
                                              </Badge>
                                            )}
                                          </span>
                                        )}
                                        <span className="block text-xs text-foreground-light">
                                          {option.description}
                                        </span>
                                      </span>
                                    </label>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        {resourceAccess === 'selected-projects' && (
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              name="selectedOrganizations"
                              control={form.control}
                              render={({ field }) => (
                                <FormItemLayout name="selectedOrganizations" label="Organization">
                                  <Select
                                    value={field.value?.[0] || ''}
                                    onValueChange={(value) => {
                                      field.onChange(value ? [value] : [])
                                      form.setValue('selectedProjects', [], {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                      setIsReviewing(false)
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {organizations.map((org) => (
                                        <SelectItem key={org.slug} value={org.slug}>
                                          {org.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItemLayout>
                              )}
                            />
                            <FormField
                              name="selectedProjects"
                              control={form.control}
                              render={({ field }) => (
                                <FormItemLayout name="selectedProjects" label="Project">
                                  <Select
                                    value={field.value?.[0] || ''}
                                    onValueChange={(value) => {
                                      field.onChange(value ? [value] : [])
                                      setIsReviewing(false)
                                    }}
                                    disabled={selectedOrganizations.length === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          selectedOrganizations.length === 0
                                            ? 'Select organization first'
                                            : 'Select project'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filteredProjectOptions.map((project) => (
                                        <SelectItem key={project.ref} value={project.ref}>
                                          {project.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                        )}

                        {resourceAccess === 'selected-orgs' && (
                          <FormField
                            name="selectedOrganizations"
                            control={form.control}
                            render={({ field }) => (
                              <FormItemLayout name="selectedOrganizations" label="Organization">
                                <Select
                                  value={field.value?.[0] || ''}
                                  onValueChange={(value) => {
                                    field.onChange(value ? [value] : [])
                                    setIsReviewing(false)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {organizations.map((org) => (
                                      <SelectItem key={org.slug} value={org.slug}>
                                        {org.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItemLayout>
                            )}
                          />
                        )}

                        {resourceAccess === 'all-orgs' && (
                          <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-3">
                            <div className="flex gap-2">
                              <TriangleAlert size={16} className="mt-0.5 text-warning" />
                              <div className="space-y-1">
                                <p className="text-sm text-foreground">
                                  Account-level access is broad.
                                </p>
                                <p className="text-xs text-foreground-light">
                                  This token can access every organization and project available to
                                  your account.
                                </p>
                              </div>
                            </div>
                            <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground-light">
                              <Checkbox
                                checked={accountLevelConfirmed}
                                onCheckedChange={(checked) => {
                                  setAccountLevelConfirmed(checked === true)
                                  setIsReviewing(false)
                                }}
                              />
                              I understand this token is not limited to one project or organization.
                            </label>
                            {showValidation && accountUnconfirmed && (
                              <FieldError message="Confirm account-level access to continue." />
                            )}
                          </div>
                        )}

                        {showValidation && resourceMissing && (
                          <FieldError message={resourceErrorMessage} />
                        )}
                      </section>

                      <Separator />

                      <ExpirationSection
                        control={form.control}
                        setValue={form.setValue}
                        trigger={form.trigger}
                        expiresAt={expiresAt}
                        customDate={customDate}
                        setCustomDate={setCustomDate}
                        setIsReviewing={setIsReviewing}
                      />

                      <Separator />

                      <section className="space-y-4 px-5 sm:px-6 py-6">
                        <SectionTitle
                          eyebrow="Capabilities"
                          title="What can it do?"
                          description="Write includes read. Choose only the capabilities this token needs."
                        />
                        <div className="border-b border-muted">
                          {visibleCapabilityGroups.map((group) => {
                            const capabilities = group.capabilityIds
                              .map((id) => CAPABILITIES_BY_ID.get(id))
                              .filter(
                                (capability): capability is Capability => capability !== undefined
                              )
                            const selectedSummary = getCapabilityGroupSummary(
                              group.capabilityIds,
                              capabilityAccess
                            )

                            return (
                              <Collapsible
                                key={group.id}
                                defaultOpen={group.defaultOpen}
                                className="border-t border-muted"
                              >
                                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 py-3.5 text-left [&[data-state=open]>svg]:rotate-90">
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                      <p className="text-sm font-medium text-foreground">
                                        {group.label}
                                      </p>
                                      {selectedSummary !== 'No access' && (
                                        <span className="text-xs text-foreground-lighter">
                                          · {selectedSummary}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground-light">
                                      {group.description}
                                    </p>
                                  </div>
                                  <ChevronRight
                                    size={16}
                                    className="shrink-0 text-foreground-lighter transition-transform"
                                  />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="pb-1.5">
                                    {capabilities.map((capability) => (
                                      <CapabilityControlRow
                                        key={capability.id}
                                        capability={capability}
                                        level={capabilityAccess[capability.id] ?? 'none'}
                                        onChange={updateCapability}
                                      />
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )
                          })}
                        </div>
                        {showValidation && capabilityMissing && (
                          <FieldError message="Grant at least one capability (Read or Write) to continue." />
                        )}
                      </section>

                      <Separator />

                      <section className="space-y-3 px-5 sm:px-6 py-6">
                        <div className="w-full flex gap-x-2 items-center">
                          <WarningIcon />
                          <span className="text-xs text-left text-foreground-lighter">
                            Once you generate this token, its permissions cannot be changed.
                          </span>
                        </div>
                      </section>
                    </>
                  )}
                </div>

                <aside className="bg-surface-75 px-4 py-6 xl:sticky xl:top-0 xl:h-[calc(100vh-116px)] xl:overflow-y-auto">
                  <LivePreview
                    resourceSelection={resourceSelection}
                    canList={canList}
                    cannotList={cannotList}
                    capabilitySummary={capabilitySummary}
                    enabledTools={enabledTools}
                    risk={risk}
                  />
                </aside>
              </div>
            </Form>
          </div>
        </ScrollArea>
        <SheetFooter className="justify-end! w-full mt-auto py-4 border-t">
          <div className="flex gap-2">
            {isReviewing && (
              <Button variant="default" disabled={isPending} onClick={() => setIsReviewing(false)}>
                Back
              </Button>
            )}
            <Button variant="default" disabled={isPending} onClick={handleClose}>
              Cancel
            </Button>
            {isReviewing ? (
              <Button
                onClick={form.handleSubmit(onSubmit, () => setShowValidation(true))}
                loading={isPending}
              >
                Generate token
              </Button>
            ) : (
              <Button onClick={handleReview} iconRight={<Eye />}>
                Review access
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function CapabilityControlRow({
  capability,
  level,
  onChange,
}: {
  capability: Capability
  level: AccessLevel
  onChange: (capabilityId: string, level: AccessLevel) => void
}) {
  const accessConfig = level === 'none' ? undefined : getCapabilityAccessConfig(capability, level)

  return (
    <div className="border-t border-muted py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{capability.label}</p>
            <CapabilityRisk risk={capability.risk} level={level} />
          </div>
          <p className="text-xs text-foreground-light">{capability.description}</p>
        </div>
        <ToggleGroup
          type="single"
          value={level}
          onValueChange={(value) => onChange(capability.id, (value || 'none') as AccessLevel)}
          className="shrink-0 rounded-md border bg-transparent p-0.5"
        >
          <ToggleGroupItem value="none" size="sm" className="h-7 px-3">
            None
          </ToggleGroupItem>
          <ToggleGroupItem value="read" size="sm" className="h-7 px-3">
            Read
          </ToggleGroupItem>
          {!capability.readOnly && (
            <ToggleGroupItem value="write" size="sm" className="h-7 px-3">
              Write
            </ToggleGroupItem>
          )}
        </ToggleGroup>
      </div>

      {accessConfig && (
        <div
          className={cn(
            'mt-3 grid gap-4',
            accessConfig.mcpTools.length ? 'sm:grid-cols-2' : 'grid-cols-1'
          )}
        >
          <div className="space-y-1.5">
            <p className="text-[11px] text-foreground-lighter">Allows</p>
            <ul className="space-y-1">
              {accessConfig.allows.map((item) => (
                <li key={item} className="text-[12.5px] text-foreground-light">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {accessConfig.mcpTools.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-foreground-lighter">MCP tools</p>
              <div className="space-y-1 font-mono text-xs text-foreground-lighter">
                {accessConfig.mcpTools.map((tool) => (
                  <div key={tool}>{tool}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpirationSection({
  control,
  setValue,
  trigger,
  expiresAt,
  customDate,
  setCustomDate,
  setIsReviewing,
}: {
  control: ReturnType<typeof useForm<TokenFormValues>>['control']
  setValue: ReturnType<typeof useForm<TokenFormValues>>['setValue']
  trigger: ReturnType<typeof useForm<TokenFormValues>>['trigger']
  expiresAt: string | undefined
  customDate: Date | undefined
  setCustomDate: (date: Date | undefined) => void
  setIsReviewing: (reviewing: boolean) => void
}) {
  // The exact moment the token will expire, resolved from the selected preset
  // or the custom date.
  const resolvedExpiry = resolveExpiry(expiresAt, customDate?.toISOString())

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <SectionTitle
        eyebrow="Expiration"
        title="How long should this token last?"
        description="Choose a shorter or longer window based on the token's job."
      />
      <FormField
        name="expiresAt"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="expiresAt" label="Expires">
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  setIsReviewing(false)
                }}
                className="grid grid-cols-5 gap-2"
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'relative flex min-h-24 min-w-0 cursor-pointer items-center justify-center rounded-md border p-3 text-xs transition-colors hover:bg-surface-100',
                      field.value === option.value && 'border-stronger bg-surface-100'
                    )}
                  >
                    {option.value === EXPIRES_AT_OPTIONS.week.value && (
                      <span className="absolute left-1/2 top-4 max-w-full -translate-x-1/2 rounded-full border border-brand-500 bg-brand/10 px-2 py-0.5 text-[10px] font-medium leading-none text-brand-600">
                        Recommended
                      </span>
                    )}
                    <span className="flex min-w-0 items-center justify-center gap-3 text-center">
                      <RadioGroupItem value={option.value} className="shrink-0" />
                      <span className="block text-sm text-foreground">{option.label}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            {expiresAt === CUSTOM_EXPIRY_VALUE && (
              <div className="mt-3">
                <DatePicker
                  selectsRange={false}
                  triggerButtonSize="small"
                  contentSide="top"
                  minDate={new Date()}
                  maxDate={dayjs().add(1, 'year').toDate()}
                  onChange={(date) => {
                    const selectedDate = date.to || date.from
                    if (selectedDate) {
                      const nextDate = new Date(selectedDate)
                      setCustomDate(nextDate)
                      setValue('customExpiryDate', nextDate.toISOString(), { shouldDirty: true })
                    } else {
                      setCustomDate(undefined)
                      setValue('customExpiryDate', undefined, { shouldDirty: true })
                    }
                    // The "select a custom expiry date" error lives on the
                    // expiresAt field, so re-validate it once the date changes.
                    void trigger('expiresAt')
                    setIsReviewing(false)
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarClock size={14} />
                    {customDate ? `${dayjs(customDate).format('DD MMM, HH:mm')}` : 'Select date'}
                  </span>
                </DatePicker>
              </div>
            )}
            {resolvedExpiry && (
              <p className="mt-3 text-xs text-foreground-lighter">
                Token will expire {formatTzTimestamp(resolvedExpiry)}
              </p>
            )}
          </FormItemLayout>
        )}
      />
    </section>
  )
}

function LivePreview({
  resourceSelection,
  canList,
  cannotList,
  capabilitySummary,
  enabledTools,
  risk,
}: {
  resourceSelection: { type: string; name: string } | null
  canList: string[]
  cannotList: string[]
  capabilitySummary: Array<{ capability: Capability; level: AccessLevel }>
  enabledTools: string[]
  risk: { label: string; tone: RiskTone }
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield size={15} strokeWidth={1.5} className="text-brand" />
        <h3 className="text-sm font-medium text-foreground">Live preview</h3>
      </div>

      <div className="space-y-2">
        <Eyebrow>Resource access</Eyebrow>
        {resourceSelection ? (
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-default px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-foreground-lighter">
              {resourceSelection.type}
            </span>
            <p className="text-sm text-foreground">{resourceSelection.name}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TriangleAlert size={14} className="shrink-0 text-warning" />
            <p className="text-sm text-warning">Select a resource to continue</p>
          </div>
        )}
      </div>

      <PreviewList icon="can" title="This token can" items={canList} />
      <PreviewList
        icon="cannot"
        title="It cannot"
        items={cannotList}
        footnote={
          'Notable restrictions only — the token can only do what’s listed under "This token can".'
        }
      />

      {capabilitySummary.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <Eyebrow>Management API endpoints enabled</Eyebrow>
            {capabilitySummary.map(({ capability, level }) => {
              if (level === 'none') return null
              const accessConfig = getCapabilityAccessConfig(capability, level)

              return (
                <div key={capability.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] text-foreground-light">{capability.label}</span>
                    <AccessLevelTag level={level} />
                  </div>
                  <div className="space-y-0.5 font-mono text-[11.5px] leading-relaxed text-foreground-lighter">
                    {accessConfig.endpoints.map((endpoint) => (
                      <a
                        key={`${capability.id}-${endpoint.operationId}`}
                        href={getApiDocsUrl(endpoint.operationId)}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:underline"
                      >
                        <span className="text-foreground-light">{endpoint.method}</span>{' '}
                        {endpoint.path}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {enabledTools.length > 0 && (
        <div className="space-y-2">
          <Eyebrow>MCP tools</Eyebrow>
          <p className="font-mono text-[11.5px] leading-relaxed text-foreground-lighter">
            {enabledTools.join(', ')}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-foreground">
        {risk.tone !== 'none' && (
          <span className={cn('h-1.5 w-1.5 rounded-full', RISK_TONE_DOT[risk.tone])} aria-hidden />
        )}
        <span className={cn(risk.tone === 'none' && 'text-foreground-lighter')}>{risk.label}</span>
      </div>
    </div>
  )
}

function PreviewList({
  icon,
  title,
  items,
  footnote,
}: {
  icon: 'can' | 'cannot'
  title: string
  items: string[]
  footnote?: string
}) {
  return (
    <div className="space-y-2.5">
      <Eyebrow>{title}</Eyebrow>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-light">None</p>
      ) : (
        <ul className="flex flex-col gap-[9px]">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                'flex items-center gap-2.5 text-[13px]',
                icon === 'can' ? 'text-foreground' : 'text-foreground-lighter'
              )}
            >
              {icon === 'can' ? (
                <Check size={13} strokeWidth={1.5} className="shrink-0 text-brand" />
              ) : (
                <span className="w-[13px] shrink-0 text-center text-foreground-muted">–</span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {footnote && items.length > 0 && (
        <p className="text-xs text-foreground-lighter">{footnote}</p>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] border-b last:border-b-0">
      <div className="bg-surface-75 px-3 py-3 text-xs font-mono uppercase text-foreground-lighter">
        {label}
      </div>
      <div className="px-3 py-3 text-sm text-foreground">{value}</div>
    </div>
  )
}
