import InformationBox from 'components/ui/InformationBox'
import { AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

interface PlanExpectationInfoBoxProps {
  orgSlug: string
  projectRef: string
  planId?: string
}

export const PlanExpectationInfoBox = ({
  orgSlug,
  projectRef,
  planId,
}: PlanExpectationInfoBoxProps) => {
  return (
    <InformationBox
      icon={<AlertCircle size={18} strokeWidth={2} />}
      defaultVisibility={true}
      hideCollapse={true}
      title={
        projectRef === 'no-project'
          ? 'Please note that no project has been selected'
          : "Expected response times are based on your organization's plan"
      }
      {...(projectRef !== 'no-project' && {
        description: (
          <div className="flex flex-col gap-y-4 mb-1">
            {planId === 'free' && (
              <p>
                Free Plan support is available within the community and officially by the team on a
                best efforts basis. For a guaranteed response we recommend upgrading to the Pro
                Plan. Enhanced SLAs for support are available on our Enterprise Plan.
              </p>
            )}

            {planId === 'pro' && (
              <p>
                Pro Plan includes email-based support. You can expect an answer within 1 business
                day in most situations for all severities. We recommend upgrading to the Team Plan
                for prioritized ticketing on all issues and prioritized escalation to product
                engineering teams. Enhanced SLAs for support are available on our Enterprise Plan.
              </p>
            )}

            {planId === 'team' && (
              <p>
                Team Plan includes email-based support. You get prioritized ticketing on all issues
                and prioritized escalation to product engineering teams. Low, Normal, and High
                severity tickets will generally be handled within 1 business day, while Urgent
                issues, we respond within 1 day, 365 days a year. Enhanced SLAs for support are
                available on our Enterprise Plan.
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-y-2 sm:gap-x-2">
              <Button asChild>
                <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`}>Upgrade project</Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <Link
                  href="https://supabase.com/contact/enterprise"
                  target="_blank"
                  rel="noreferrer"
                >
                  Enquire about Enterprise
                </Link>
              </Button>
            </div>
          </div>
        ),
      })}
    />
  )
}
