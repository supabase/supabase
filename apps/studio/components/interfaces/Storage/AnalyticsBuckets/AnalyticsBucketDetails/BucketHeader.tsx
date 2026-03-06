import { noop } from 'lodash'

import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import {
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { HIDE_REPLICATION_USER_FLOW } from './AnalyticsBucketDetails.constants'
import { ConnectTablesDialog } from './ConnectTablesDialog'
import { CreateTableInstructionsDialog } from './CreateTable/CreateTableInstructionsDialog'

interface BucketHeaderProps {
  showActions?: boolean
  namespaces?: {
    namespace: string
    schema: string
    tables: FormattedWrapperTable[]
  }[]
  onSuccessConnectTables?: () => void
}

export const BucketHeader = ({
  showActions = true,
  namespaces = [],
  onSuccessConnectTables = noop,
}: BucketHeaderProps) => {
  return (
    <ScaffoldHeader className="pt-0 flex flex-row justify-between items-end gap-x-8">
      <div>
        <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
        <ScaffoldSectionDescription>
          Analytics tables stored in this bucket
        </ScaffoldSectionDescription>
      </div>
      {showActions && (
        <div className="flex items-center gap-x-2">
          {HIDE_REPLICATION_USER_FLOW ? (
            <CreateTableInstructionsDialog />
          ) : (
            namespaces.length > 0 && (
              <ConnectTablesDialog onSuccessConnectTables={onSuccessConnectTables} />
            )
          )}
        </div>
      )}
    </ScaffoldHeader>
  )
}
