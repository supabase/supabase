import { Box, Clock, Eye, Lock, Ruler, Table2, TextSearch, Unlock, User } from 'lucide-react'
import Link from 'next/link'

import { LINTER_LEVELS, LintInfo } from 'components/interfaces/Linter/Linter.constants'
import { LINT_TYPES, Lint } from 'data/lint/lint-query'
import { Badge, Button } from 'ui'

export const lintInfoMap: LintInfo[] = [
  {
    name: 'unindexed_foreign_keys',
    title: 'Unindexed foreign keys',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}`,
    linkText: 'Create an index',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0001_unindexed_foreign_keys',
  },
  {
    name: 'auth_users_exposed',
    title: 'Exposed Auth Users',
    icon: <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: 'View table',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0002_auth_users_exposed',
  },
  {
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: 'View policies',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0003_auth_rls_initplan',
  },
  {
    name: 'no_primary_key',
    title: 'No Primary Key',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/editor`,
    linkText: 'View table',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0004_no_primary_key',
  },
  {
    name: 'unused_index',
    title: 'Unused Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: 'View index',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0005_unused_index',
  },
  {
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0006_multiple_permissive_policies',
  },
  {
    name: 'policy_exists_rls_disabled',
    title: 'Policy Exists RLS Disabled',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0007_policy_exists_rls_disabled',
  },
  {
    name: 'rls_enabled_no_policy',
    title: 'RLS Enabled No Policy',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View table',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0008_rls_enabled_no_policy',
  },
  {
    name: 'duplicate_index',
    title: 'Duplicate Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`,
    linkText: 'View index',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0009_duplicate_index',
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer View',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view',
    linkText: 'View docs',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0010_security_definer_view',
  },
  {
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/functions?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View functions',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0011_function_search_path_mutable',
  },
  {
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`,
    linkText: 'View policies',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0013_rls_disabled_in_public',
  },
  {
    name: 'extension_in_public',
    title: 'Extension in Public',
    icon: <Unlock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef, metadata }) =>
      `/project/${projectRef}/database/extensions?filter=${metadata?.name}`,
    linkText: 'View extension',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0014_extension_in_public',
  },
  {
    name: 'auth_otp_long_expiry',
    title: 'Auth OTP Long Expiry',
    icon: <Clock className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
  },
  {
    name: 'auth_otp_short_length',
    title: 'Auth OTP Short Length',
    icon: <Ruler className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/providers`,
    linkText: 'View settings',
    docsLink: 'https://supabase.com/docs/guides/platform/going-into-prod#security',
  },
  {
    name: 'rls_references_user_metadata',
    title: 'RLS references user metadata',
    icon: <User className="text-foreground-muted" size={15} strokeWidth={1} />,
    link: ({ projectRef }) => `/project/${projectRef}/auth/policies`,
    linkText: 'View policies',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?queryGroups=lint&lint=0015_rls_references_user_metadata',
  },
  {
    name: 'materialized_view_in_api',
    title: 'Materialized View in API',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-advisors?lint=0016_materialized_view_in_api`,
    linkText: 'View docs',
    docsLink:
      'https://supabase.com/docs/guides/database/database-advisors?lint=0016_materialized_view_in_api',
  },
  {
    name: 'foreign_table_in_api',
    title: 'Foreign Table in API',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api`,
    linkText: 'View docs',
    docsLink:
      'https://supabase.com/docs/guides/database/database-linter?lint=0017_foreign_table_in_api',
  },
  {
    name: 'unsupported_reg_types',
    title: 'Unsupported reg types',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1.5} />,
    link: () =>
      `https://supabase.com/docs/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint`,
    linkText: 'View docs',
    docsLink:
      'https://supabase.com/docs/guides/database/database-advisors?lint=0018_unsupported_reg_types&queryGroups=lint',
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
      <Link href={link} target="_blank" rel="noreferrer" className="no-underline">
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
    <Badge variant={category === 'SECURITY' ? 'destructive' : 'warning'} className="capitalize">
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
