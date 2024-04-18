import { LINT_TYPES, Lint } from 'data/lint/lint-query'
import { Box, Eye, Lock, Table2, Unlock, TextSearch } from 'lucide-react'
import Link from 'next/link'
import { Button, Badge } from 'ui'
import { LINTER_LEVELS, LintInfo } from 'components/interfaces/Linter/Linter.constants'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

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

export const entityTypeIcon = (type: string) => {
  switch (type) {
    case 'table':
      return <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />
    case 'view':
      return <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />
    default:
      return <Box className="text-foreground-muted" size={15} strokeWidth={1.5} />
  }
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

export const lintCountLabel = (isLoading: boolean, count: number, label: string) => (
  <>
    {isLoading ? (
      <ShimmeringLoader className="w-20 pt-1" />
    ) : (
      <>
        {count} {label}
      </>
    )}
  </>
)
