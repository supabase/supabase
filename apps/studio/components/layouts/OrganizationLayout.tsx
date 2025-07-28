import { ExternalLink } from 'lucide-react'
import { type PropsWithChildren } from 'react'

import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'

const OrganizationLayoutContent = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })

  return (
    <div className={cn('w-full flex flex-col overflow-hidden')}>
      {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
        <Alert_Shadcn_
          variant="default"
          className="flex items-center gap-4 border-t-0 border-x-0 rounded-none"
        >
          <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
          <AlertTitle_Shadcn_ className="flex-1">
            This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
          </AlertTitle_Shadcn_>
          <Button asChild type="default" iconRight={<ExternalLink />} disabled={!isSuccess}>
            <a href={data?.url} target="_blank" rel="noopener noreferrer">
              Manage
            </a>
          </Button>
        </Alert_Shadcn_>
      )}
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  )
}

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  return <OrganizationLayoutContent>{children}</OrganizationLayoutContent>
}

export default withAuth(OrganizationLayout)
