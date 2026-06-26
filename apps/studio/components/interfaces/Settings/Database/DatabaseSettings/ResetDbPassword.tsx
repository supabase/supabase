import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { ResetDbPasswordDialog } from './ResetDbPasswordDialog'

export const ResetDbPassword = ({ disabled = false }) => {
  return (
    <PageSection id="database-password">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Database password</PageSectionTitle>

          <PageSectionDescription>Used for direct Postgres connections</PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="flex flex-row items-center gap-x-2 justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm text-foreground">Reset database password</h3>
              <p className="text-sm text-foreground-light text-balance">
                The database password isn’t viewable after creation. Resetting it will break any
                existing connections.
              </p>
            </div>
            <ResetDbPasswordDialog disabled={disabled} />
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}

export default ResetDbPassword
