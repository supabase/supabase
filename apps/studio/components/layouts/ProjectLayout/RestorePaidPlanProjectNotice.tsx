import { ExternalLink } from 'lucide-react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export const RestorePaidPlanProjectNotice = () => {
  return (
    <Alert_Shadcn_>
      <WarningIcon />
      <AlertTitle_Shadcn_>
        Project will count towards compute usage once restored
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        For every hour your instance is active, we will bill you based on the compute size of your
        project.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-3">
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            href="https://supabase.com/docs/guides/platform/org-based-billing#billing-for-compute-compute-hours"
            target="_blank"
            rel="noreferrer"
          >
            More information
          </a>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
