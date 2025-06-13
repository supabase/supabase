import AlertError from 'components/ui/AlertError'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { Skeleton } from 'ui'
import { OrganizationCard } from './OrganizationCard'

export const OrgNotFound = () => {
  const {
    data: organizations,
    isSuccess: isOrganizationsSuccess,
    isLoading: isOrganizationsLoading,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery()

  return (
    <>
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
          organizations?.map((org) => <OrganizationCard key={org.slug} organization={org} />)}
      </div>
    </>
  )
}
