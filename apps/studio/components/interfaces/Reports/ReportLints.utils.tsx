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
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'auth_users_exposed',
    title: 'Exposed Auth Users',
    icon: <Lock size={15} strokeWidth={1.5} />,
  },
  {
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'no_primary_key',
    title: 'No Primary Key',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'unused_index',
    title: 'Unused Index',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'rls_enabled_no_policy',
    title: 'RLS Enabled No Policy',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'policy_exists_rls_disabled',
    title: 'Policy Exists RLS Disabled',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer View',
    icon: <Eye size={15} strokeWidth={1.5} />,
  },
  {
    name: 'duplicate_index',
    title: 'Duplicate Index',
    icon: <Table2 size={15} strokeWidth={1} />,
  },
  {
    name: 'extension_in_public',
    title: 'Extension in Public',
    icon: <Unlock size={15} strokeWidth={1} />,
  },
]

export function getHumanReadableTitle(title: LINT_TYPES) {
  switch (title) {
    case 'unindexed_foreign_keys':
      return 'Unindexed foreign keys'
    case 'auth_users_exposed':
      return 'Exposed Auth Users'
    case 'auth_rls_initplan':
      return 'Auth RLS Initialization Plan'
    case 'no_primary_key':
      return 'No Primary Key'
    case 'unused_index':
      return 'Unused Index'
    case 'multiple_permissive_policies':
      return 'Multiple Permissive Policies'
    case 'function_search_path_mutable':
      return 'Function Search Path Mutable'
    case 'rls_enabled_no_policy':
      return 'RLS Enabled No Policy'
    case 'policy_exists_rls_disabled':
      return 'Policy Exists RLS Disabled'
    case 'rls_disabled_in_public':
      return 'RLS Disabled in Public'
    case 'security_definer_view':
      return 'Security Definer View'
    case 'duplicate_index':
      return 'Duplicate Index'
    case 'extension_in_public':
      return 'Extension in Public'
    default:
      assertUnreachable(title)
      throw new Error('This case should never be reached')
  }
}

export function getLintIcon(title: LINT_TYPES) {
  switch (title) {
    case 'unindexed_foreign_keys':
      return <Key size={15} strokeWidth={1.5} />
    case 'auth_users_exposed':
      return <Lock size={15} strokeWidth={1.5} />
    // case 'auth_rls_initplan':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'no_primary_key':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'unused_index':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'multiple_permissive_policies':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'function_search_path_mutable':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'rls_enabled_no_policy':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'policy_exists_rls_disabled':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'rls_disabled_in_public':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'security_definer_view':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    // case 'duplicate_index':
    //   return <LinkIcon size={15} strokeWidth={1.5} />
    default:
      return <AlertCircle size={15} strokeWidth={1.5} />
  }
}

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
          >
            Create an index
          </Link>
        </Button>
      )

    case 'auth_users_exposed':
      return (
        <Button asChild type="default">
          <Link href={`/project/${projectRef}/editor`} target="_blank" rel="noreferrer">
            View table
          </Link>
        </Button>
      )
    case 'auth_rls_initplan':
      return (
        <Button asChild type="default">
          <Link href={`/project/${projectRef}/auth/policies`} target="_blank" rel="noreferrer">
            View policies
          </Link>
        </Button>
      )
    case 'no_primary_key':
      return (
        <Button asChild type="default">
          <Link href={`/project/${projectRef}/editor`} target="_blank" rel="noreferrer">
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
      return <Table2 size={15} strokeWidth={1} />
    case 'view':
      return <Eye size={15} strokeWidth={1.5} />
    default:
      return <Box size={15} strokeWidth={1.5} />
  }
}
