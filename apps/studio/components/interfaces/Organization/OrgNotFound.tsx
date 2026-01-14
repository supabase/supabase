import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { Skeleton } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { OrganizationCard } from './OrganizationCard'

export const OrgNotFound = ({ slug }: { slug?: string }) => {
  const {
    data: organizations,
    isSuccess: isOrganizationsSuccess,
    isPending: isOrganizationsLoading,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery()

  return (
    <>
      {slug !== '_' && (
        <Admonition
          type="destructive"
          title="Organization not found"
          description={
            <>
              {slug ? (
                <>
                  The organization <code className="text-code-inline">{slug}</code>{' '}
                </>
              ) : (
                <>This organization </>
              )}
              does not exist or you do not have permission to access to it. Contact the the owner if
              you believe this is a mistake.
            </>
          }
        />
      )}

      <h3 className="text-sm">Select a different organization to create your new project in</h3>

      <div className="grid gap-2 grid-cols-2">
        {isOrganizationsLoading && (
          <>
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
          </>
        )}
        {isOrganizationsError && (
          <Admonition
            type="destructive"
            title="Failed to load organizations"
            description={organizationsError?.message}
          />
        )}
        {isOrganizationsSuccess &&
          organizations?.map((org) => (
            <OrganizationCard key={org.slug} organization={org} href={`/new/${org.slug}`} />
          ))}
      </div>
    </>
  )
}
