import AlertError from 'components/ui/AlertError'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { Skeleton } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { OrganizationCard } from './OrganizationCard'

export const OrgNotFound = ({ slug }: { slug?: string }) => {
  const {
    data: organizations,
    isSuccess: isOrganizationsSuccess,
    isLoading: isOrganizationsLoading,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery()

  return (
    <>
      {slug !== '_' && (
        <Admonition type="danger">
          The selected organization does not exist or you don't have permission to access it.{' '}
          {slug ? (
            <>
              Contact the owner or administrator to create a new project in the <code>{slug}</code>{' '}
              organization.
            </>
          ) : (
            <>Contact the owner or administrator to create a new project.</>
          )}
        </Admonition>
      )}

      <h3 className="text-sm">Select an organization to create your new project from</h3>

      <div className="grid gap-2 grid-cols-2">
        {isOrganizationsLoading && (
          <>
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
          </>
        )}
        {isOrganizationsError && (
          <AlertError error={organizationsError} subject="Failed to load organizations" />
        )}
        {isOrganizationsSuccess &&
          organizations?.map((org) => (
            <OrganizationCard key={org.slug} organization={org} href={`/new/${org.slug}`} />
          ))}
      </div>
    </>
  )
}
