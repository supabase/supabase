import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { AlertCircle } from 'lucide-react'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

interface DataApiDisabledStateProps {
  description: string
}

export const DataApiDisabledState = ({ description }: DataApiDisabledStateProps) => {
  const { ref: projectRef } = useParams()

  return (
    <div className="flex w-full flex-1 items-center justify-center p-10">
      <Alert_Shadcn_ className="max-w-md">
        <AlertCircle size={16} />
        <AlertTitle_Shadcn_>Data API is disabled</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          Enable the Data API in the{' '}
          <InlineLink href={`/project/${projectRef}/integrations/data_api/overview`}>
            Overview
          </InlineLink>{' '}
          tab to {description}.
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    </div>
  )
}
