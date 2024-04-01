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
    default:
      assertUnreachable(title)
      return <></>
  }
}
