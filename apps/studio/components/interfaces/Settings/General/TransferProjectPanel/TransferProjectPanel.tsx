import { Truck } from 'lucide-react'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { TransferProjectButton } from './TransferProjectButton'
import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export const TransferProjectPanel = () => {
  const { data: project } = useSelectedProjectQuery()

  if (project === undefined) return null

  return (
    <PageSection id="transfer-project">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Transfer project</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
              <div className="flex space-x-4">
                <Truck className="mt-1" />
                <div className="space-y-1 xl:max-w-lg">
                  <p className="text-sm">Transfer project to another organization</p>
                  <p className="text-sm text-foreground-light">
                    To transfer projects, the owner must be a member of both the source and target
                    organizations.
                  </p>
                </div>
              </div>
              <div>
                <TransferProjectButton />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
