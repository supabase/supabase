import { ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle, Button, WarningIcon } from 'ui'

import { DOCS_URL } from '@/lib/constants'

export const RestorePaidPlanProjectNotice = () => {
  return (
    <Alert>
      <WarningIcon />
      <AlertTitle>Project will count towards compute usage once restored</AlertTitle>
      <AlertDescription>
        For every hour your instance is active, we will bill you based on the compute size of your
        project.
      </AlertDescription>
      <AlertDescription className="mt-3">
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
            target="_blank"
            rel="noreferrer"
          >
            More information
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
