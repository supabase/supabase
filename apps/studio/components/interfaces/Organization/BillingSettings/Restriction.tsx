import dayjs from 'dayjs'
import { useSelectedOrganization } from 'hooks'
import { AlertTriangle } from 'lucide-react'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

export const Restriction = () => {
  const org = useSelectedOrganization()
  const snap = useOrgSettingsPageStateSnapshot()

  if (!org?.restriction_status) {
    return null
  }

  return (
    <div className="pt-4">
      {org?.restriction_status === 'grace_period' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>The quota has been surpassed</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your organization has surpassed its plan’s quota. Service restrictions will apply if
              your usage is above your quota after your grace period. If Service Restrictions are
              active, your projects will no longer be able to serve requests.
            </p>
            <p>
              Your grace period ends on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}.
            </p>
            <p>
              Reduce your usage below your plan’s quota or{' '}
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                upgrade your plan
              </a>
              .{/* [Learn More Button] (links to future doc page) */}
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {org?.restriction_status === 'grace_period_over' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            The quota has been surpassed and grace period is over
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              You have exceeded your plan’s quota in the past and your grace period ended on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}. Service
              restrictions will apply if your usage is above your quota.
            </p>
            <p>
              If Service Restrictions are active, your projects will no longer be able to serve
              requests.
            </p>
            <p>
              Reduce your usage below your plan’s quota{' '}
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                upgrade your plan
              </a>
              .
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {org?.restriction_status === 'restricted' && (
        <Alert_Shadcn_ variant="destructive">
          <AlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>All services are restricted</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your services are currently restricted. Your projects are not able to serve requests.
            </p>
            <p>
              You have exceeded your plan’s quota and your grace period ended on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}.
            </p>
            <p>
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                Upgrade
              </a>{' '}
              to lift restrictions or wait until your quota refills.
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
    </div>
  )
}
