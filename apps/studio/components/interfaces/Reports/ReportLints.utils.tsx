import { LINT_TYPES, Lint } from 'data/lint/lint-query'
import { AlertCircle, Box, Eye, Key, Lock, Table2, Unlock } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

const assertUnreachable = (n: never) => {
  console.error('Unhandled lint type', n)
}

interface LintInfo {
  title: string
  icon: JSX.Element
}

export const lintInfoMap = [
  {
    name: 'unindexed_foreign_keys',
    title: 'Unindexed foreign keys',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'auth_users_exposed',
    title: 'Exposed Auth Users',
    icon: <Lock className="text-foreground-muted" size={15} strokeWidth={1.5} />,
  },
  {
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'no_primary_key',
    title: 'No Primary Key',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'unused_index',
    title: 'Unused Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'rls_enabled_no_policy',
    title: 'RLS Enabled No Policy',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'policy_exists_rls_disabled',
    title: 'Policy Exists RLS Disabled',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer View',
    icon: <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />,
  },
  {
    name: 'duplicate_index',
    title: 'Duplicate Index',
    icon: <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />,
  },
  {
    name: 'extension_in_public',
    title: 'Extension in Public',
    icon: <Unlock className="text-foreground-muted" size={15} strokeWidth={1} />,
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
  switch (title) {
    case 'unindexed_foreign_keys':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/database/indexes?schema=${metadata?.schema}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            Create an index
          </Link>
        </Button>
      )

    case 'auth_users_exposed':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/editor`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View table
          </Link>
        </Button>
      )
    case 'auth_rls_initplan':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/auth/policies`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View policies
          </Link>
        </Button>
      )
    case 'no_primary_key':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/editor`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View table
          </Link>
        </Button>
      )
    case 'unused_index':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View index
          </Link>
        </Button>
      )
    case 'duplicate_index':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/database/indexes?schema=${metadata?.schema}&table=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View index
          </Link>
        </Button>
      )
    case 'multiple_permissive_policies':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View policies
          </Link>
        </Button>
      )
    case 'function_search_path_mutable':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/database/functions?schema=${metadata?.schema}&search=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View functions
          </Link>
        </Button>
      )
    case 'rls_enabled_no_policy':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View policies
          </Link>
        </Button>
      )
    case 'policy_exists_rls_disabled':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View policies
          </Link>
        </Button>
      )
    case 'rls_disabled_in_public':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/auth/policies?schema=${metadata?.schema}&search=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View policies
          </Link>
        </Button>
      )
    case 'security_definer_view':
      // we don't have a good place to send the user to check out a view
      return <></>
    case 'extension_in_public':
      return (
        <Button asChild type="default">
          <Link
            href={`/project/${projectRef}/database/extensions?filter=${metadata?.name}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            View extension
          </Link>
        </Button>
      )
    default:
      assertUnreachable(title)
      return <></>
  }
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
