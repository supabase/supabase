import { CreateTableInstructionsDialog } from './CreateTable/CreateTableInstructionsDialog'
import {
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from '@/components/layouts/Scaffold'

interface BucketHeaderProps {
  showActions?: boolean
}

export const BucketHeader = ({ showActions = true }: BucketHeaderProps) => {
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
          <CreateTableInstructionsDialog />
        </div>
      )}
    </ScaffoldHeader>
  )
}
