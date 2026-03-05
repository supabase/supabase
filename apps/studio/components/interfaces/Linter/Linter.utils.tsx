import {
  Box,
  Clock,
  Eye,
  Lock,
  LockIcon,
  Ruler,
  Scaling,
  Table2,
  TextSearch,
  Unlock,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import { LINTER_LEVELS, LintInfo } from '@/components/interfaces/Linter/Linter.constants'
import { Lint, LINT_TYPES } from '@/data/lint/lint-query'
import { DOCS_URL } from '@/lib/constants'

export const lintInfoMap: LintInfo[] = [
  {
    name: 'unindexed_foreign_keys',
    title: 'Unindexed foreign keys',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}`,
    linkText: 'Create an index',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0001_unindexed_foreign_keys`,
    category: 'performance',
  },
  {
    name: 'auth_users_exposed',
    title: 'Exposed Auth Users',
    icon: <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: 'View table',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0002_auth_users_exposed`,
    category: 'security',
  },
  {
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0003_auth_rls_initplan`,
    category: 'performance',
  },
  {
    name: 'no_primary_key',
    title: 'No Primary Key',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: 'View table',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0004_no_primary_key`,
    category: 'performance',
  },
  {
    name: 'unused_index',
    title: 'Unused Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: 'View index',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0005_unused_index`,
    category: 'performance',
  },
  {
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0006_multiple_permissive_policies`,
    category: 'performance',
  },
  {
    name: 'policy_exists_rls_disabled',
    title: 'Policy Exists RLS Disabled',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0007_policy_exists_rls_disabled`,
    category: 'security',
  },
  {
    name: 'rls_enabled_no_policy',
    title: 'RLS Enabled No Policy',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View table',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0008_rls_enabled_no_policy`,
    category: 'security',
  },
  {
    name: 'duplicate_index',
    title: 'Duplicate Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: 'View index',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0009_duplicate_index`,
    category: 'performance',
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer View',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view`,
    linkText: 'View docs',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view`,
    category: 'security',
  },
  {
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/functions?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View functions',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0011_function_search_path_mutable`,
    category: 'security',
  },
  {
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0013_rls_disabled_in_public`,
    category: 'security',
  },
  {
    name: 'extension_in_public',
    title: 'Extension in Public',
    icon: <Unlock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/extensions?filter=${metadata?.name}`,
    linkText: 'View extension',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0014_extension_in_public`,
    category: 'security',
  },
  {
    name: 'auth_otp_long_expiry',
    title: 'Auth OTP Long Expiry',
    icon: <Clock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/going-into-prod#security`,
    category: 'security',
  },
  {
    name: 'auth_otp_short_length',
    title: 'Auth OTP Short Length',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/going-into-prod#security`,
    category: 'security',
  },
  {
    name: 'auth_db_connections_absolute',
    title: 'Auth Absolute Connection Management Strategy',
    icon: <Scaling className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/performance`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/going-into-prod`,
    category: 'performance',
  },
  {
    name: 'rls_references_user_metadata',
    title: 'RLS references user metadata',
    icon: <User className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?queryGroups=lint&lint=0015_rls_references_user_metadata`,
    category: 'security',
  },
  {
    name: 'materialized_view_in_api',
    title: 'Materialized View in API',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () => `${DOCS_URL}/guides/database/database-advisors?lint=0016_materialized_view_in_api`,
    linkText: 'View docs',
    docsLink: `${DOCS_URL}/guides/database/database-advisors?lint=0016_materialized_view_in_api`,
    category: 'security',
  },
  {
    name: 'foreign_table_in_api',
    title: 'Foreign Table in API',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () => `${DOCS_URL}/guides/database/database-linter?lint=0017_foreign_table_in_api`,
    linkText: 'View docs',
    docsLink: `${DOCS_URL}/guides/database/database-linter?lint=0017_foreign_table_in_api`,
    category: 'security',
  },
  {
    name: 'unsupported_reg_types',
    title: 'Unsupported reg types',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `${DOCS_URL}/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint`,
    linkText: 'View docs',
    docsLink: `${DOCS_URL}/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint`,
    category: 'security',
  },
  {
    name: 'ssl_not_enforced',
    title: 'SSL not enforced',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/database/settings`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/ssl-enforcement`,
    category: 'security',
  },
  {
    name: 'network_restrictions_not_set',
    title: 'No network restrictions',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/database/settings`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/network-restrictions`,
    category: 'security',
  },
  {
    name: 'password_requirements_min_length',
    title: 'Minimum password length not set or inadequate',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers?provider=Email`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/going-into-prod#security`,
    category: 'security',
  },
  {
    name: 'pitr_not_enabled',
    title: 'PITR not enabled',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/database/backups/pitr`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/backups#point-in-time-recovery`,
    category: 'security',
  },
  {
    name: 'auth_leaked_password_protection',
    title: 'Leaked Password Protection Disabled',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers?provider=Email`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/auth/password-security#password-strength-and-leaked-password-protection`,
    category: 'security',
  },
  {
    name: 'auth_insufficient_mfa_options',
    title: 'Insufficient MFA Options',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/mfa`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/auth/auth-mfa`,
    category: 'security',
  },
  {
    name: 'auth_password_policy_missing',
    title: 'Password Policy Missing',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers?provider=Email`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/auth/password-security`,
    category: 'security',
  },
  {
    name: 'leaked_service_key',
    title: 'Leaked Service Key Detected',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/settings/api-keys`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/api/api-keys#the-servicerole-key`,
    category: 'security',
  },
  {
    name: 'no_backup_admin',
    title: 'No Backup Admin Detected',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/mfa`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/auth/auth-mfa`,
    category: 'security',
  },
  {
    name: 'vulnerable_postgres_version',
    title: 'Postgres version has security patches available',
    icon: <LockIcon className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/settings/infrastructure`,
    linkText: 'View settings',
    docsLink: `${DOCS_URL}/guides/platform/upgrading`,
    category: 'security',
  },
  {
    name: 'sensitive_columns_exposed',
    title: 'Sensitive Columns Exposed',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/editor?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: 'View table',
    docsLink: `${DOCS_URL}/guides/database/database-linter?lint=0023_sensitive_columns_exposed`,
    category: 'security',
  },
  {
    name: 'rls_policy_always_true',
    title: 'RLS Policy Always True',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink: `${DOCS_URL}/guides/database/database-linter?lint=0024_permissive_rls_policy`,
    category: 'security',
  },
]

export const LintCTA = ({
  title,
  projectRef,
  metadata,
}: {
  title: LINT_TYPES
  projectRef: string
  metadata: Lint['metadata']
}) => {
  const lintInfo = lintInfoMap.find((item) => item.name === title)

  if (!lintInfo) {
    return null
  }

  const link = lintInfo.link({ projectRef, metadata })
  const linkText = lintInfo.linkText

  return (
    <Button asChild type="default">
      <Link href={link} rel="noreferrer" className="no-underline">
        {linkText}
      </Link>
    </Button>
  )
}

export const EntityTypeIcon = ({ type }: { type: string | undefined }) => {
  switch (type) {
    case 'table':
      return <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />
    case 'view':
      return <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />
    case 'auth':
      return <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />
    default:
      return <Box className="text-foreground-muted" size={15} strokeWidth={1.5} />
  }
}

export const LintEntity = ({ metadata }: { metadata: Lint['metadata'] }) => {
  return (
    (metadata &&
      (metadata.entity ||
        (metadata.schema && metadata.name && `${metadata.schema}.${metadata.name}`))) ??
    undefined
  )
}

export const LintCategoryBadge = ({ category }: { category: string }) => {
  return (
    <Badge variant={category === 'SECURITY' ? 'destructive' : 'warning'}>
      {category.toLowerCase()}
    </Badge>
  )
}

export const NoIssuesFound = ({ level }: { level: string }) => {
  const noun = level === LINTER_LEVELS.ERROR ? 'errors' : 'warnings'
  return (
    <div className="absolute top-28 px-6 flex flex-col items-center justify-center w-full gap-y-2">
      <TextSearch className="text-foreground-muted" strokeWidth={1} />
      <div className="text-center">
        <p className="text-foreground">No {noun} detected</p>
        <p className="text-foreground-light">
          Congrats! There are no {noun} detected for this database
        </p>
      </div>
    </div>
  )
}

export const createLintSummaryPrompt = (lint: Lint) => {
  const title = lintInfoMap.find((item) => item.name === lint.name)?.title ?? lint.title
  const entity =
    (lint.metadata &&
      (lint.metadata.entity ||
        (lint.metadata.schema &&
          lint.metadata.name &&
          `${lint.metadata.schema}.${lint.metadata.name}`))) ||
    'N/A'
  const schema = lint.metadata?.schema ?? 'N/A'
  const issue = lint.detail ? lint.detail.replace(/\\`/g, '`') : 'N/A'
  const description = lint.description ? lint.description.replace(/\\`/g, '`') : 'N/A'
  return `Summarize the issue and suggest fixes for the following lint item:
Title: ${title}
Entity: ${entity}
Schema: ${schema}
Issue Details: ${issue}
Description: ${description}`
}
