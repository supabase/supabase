import { Truck } from 'lucide-react'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, CardContent } from 'ui'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import TransferProjectButton from './TransferProjectButton'

export const TransferProjectPanel = () => {
  const { data: project } = useSelectedProjectQuery()

  if (project === undefined) return null

  return (
    <ScaffoldSection id="transfer-project" className="gap-6">
      <ScaffoldSectionTitle>
        Transfer Project
        <ScaffoldSectionDescription>
          Transfer your project to a different organization.
        </ScaffoldSectionDescription>
      </ScaffoldSectionTitle>

      <Card>
        <CardContent className="flex justify-between items-center">
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
          <TransferProjectButton />
        </CardContent>
      </Card>
    </ScaffoldSection>
  )
}
