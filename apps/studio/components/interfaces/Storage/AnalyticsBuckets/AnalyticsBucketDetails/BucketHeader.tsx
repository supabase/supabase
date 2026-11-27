import {
  PageSectionAside,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { CreateTableInstructionsDialog } from './CreateTable/CreateTableInstructionsDialog'

interface BucketHeaderProps {
  showActions?: boolean
}

export const BucketHeader = ({ showActions = true }: BucketHeaderProps) => {
  return (
    <PageSectionMeta>
      <PageSectionSummary>
        <PageSectionTitle>Tables</PageSectionTitle>
        <PageSectionDescription>Analytics tables stored in this bucket</PageSectionDescription>
      </PageSectionSummary>
      {showActions && (
        <PageSectionAside>
          <CreateTableInstructionsDialog />
        </PageSectionAside>
      )}
    </PageSectionMeta>
  )
}
