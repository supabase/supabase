import { useParams } from 'common'

import type { DatabaseObjectDetailsProps } from './DatabaseObjectDetails'
import { DetailsProperties, DetailsProperty, DetailsSection } from './DetailsSection'
import { RelationDetailsHeader } from './RelationDetailsHeader'
import { TableTriggers } from './TableDetails'
import { AddUserDropdown } from '@/components/interfaces/Auth/Users/AddUserDropdown'
import { InlineLink } from '@/components/ui/InlineLink'
import { useUsersCountQuery } from '@/data/auth/users-count-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * `auth.users` is the project's users, so it's described as users rather than as a table:
 * how many there are, how they sign in, and adding one through Auth. Its triggers stay,
 * since a trigger on sign-up is how most projects build on top of their users.
 */
export const UsersTableDetails = ({ relation }: DatabaseObjectDetailsProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: usersCount } = useUsersCountQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <div className="flex flex-col">
      <RelationDetailsHeader
        relation={relation}
        title="Users"
        subtitle="Supabase Auth"
        action={<AddUserDropdown />}
      />
      <DetailsSection title="Properties">
        <DetailsProperties>
          <DetailsProperty label="Users">
            {usersCount === undefined
              ? '–'
              : `${usersCount.is_estimate ? '~' : ''}${usersCount.count.toLocaleString()}`}
          </DetailsProperty>
          <DetailsProperty label="Sign-in">
            <InlineLink href={`/project/${ref}/auth/providers`}>Configure providers</InlineLink>
          </DetailsProperty>
        </DetailsProperties>
      </DetailsSection>
      <TableTriggers relation={relation} isSchemaLocked />
    </div>
  )
}
