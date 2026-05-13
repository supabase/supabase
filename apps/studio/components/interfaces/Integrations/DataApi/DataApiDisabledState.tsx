import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'

interface DataApiDisabledStateProps {
  description: string
}

export const DataApiDisabledState = ({ description }: DataApiDisabledStateProps) => {
  const { ref: projectRef } = useParams()

  return (
    <div className="flex w-full flex-1 items-center justify-center p-10">
      <Alert className="max-w-md">
        <AlertCircle size={16} />
        <AlertTitle>Data API is disabled</AlertTitle>
        <AlertDescription>
          Enable the Data API in the{' '}
          <InlineLink href={`/project/${projectRef}/integrations/data_api/overview`}>
            Overview
          </InlineLink>{' '}
          tab to {description}.
        </AlertDescription>
      </Alert>
    </div>
  )
}
