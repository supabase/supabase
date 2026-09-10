import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'

interface WarehouseDisabledStateProps {
  description: string
}

export const WarehouseDisabledState = ({ description }: WarehouseDisabledStateProps) => {
  const { ref: projectRef } = useParams()

  return (
    <div className="flex w-full p-10">
      <Alert className="max-w-md mx-auto">
        <AlertCircle size={16} />
        <AlertTitle>Warehouse is not set up</AlertTitle>
        <AlertDescription>
          Set up Warehouse in the{' '}
          <InlineLink href={`/project/${projectRef}/integrations/warehouse/overview`}>
            Overview
          </InlineLink>{' '}
          tab to {description}.
        </AlertDescription>
      </Alert>
    </div>
  )
}
