import { LINT_TYPES, Lint } from 'data/lint/lint-query'
import Link from 'next/link'
import { Button } from 'ui'

const assertUnreachable = (n: never) => {
  console.error('Unhandled lint type', n)
}

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
