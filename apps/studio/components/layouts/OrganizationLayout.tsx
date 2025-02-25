import { OrganizationResourceBanner } from 'components/interfaces/Organization/resource-banner'
import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { ExternalLink } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'
import { ScaffoldContainer } from './Scaffold'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()

  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })

  return (
    <div className="flex flex-row h-full w-full">
      <div className={cn('w-full flex flex-col overflow-hidden')}>
        {/* <OrganizationResourceBanner /> */}
        {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
          <ScaffoldContainer className="mt-8">
            <Alert_Shadcn_ variant="default" className="flex items-center gap-4">
              <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
              <AlertTitle_Shadcn_ className="flex-1">
                This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
              </AlertTitle_Shadcn_>
              <Button type="default" iconRight={<ExternalLink />} asChild disabled={!isSuccess}>
                <a href={data?.url} target="_blank" rel="noopener noreferrer">
                  Manage
                </a>
              </Button>
            </Alert_Shadcn_>
          </ScaffoldContainer>
        )}
        <main className="h-full w-full overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export default OrganizationLayout
