import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ComponentProps, useEffect, useMemo, useState } from 'react'

import { DowngradeModal } from './DowngradeModal'
import { ExitSurveyModal } from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

type CancellationFlowProps = {
  onDowngrade?: () => void
  onCancel?: () => void
  visible: boolean
}

type CancellationFlowState =
  | 'closed'
  | 'show-downgrade-modal'
  | 'show-downgrade-error'
  | 'show-exit-survey'

export const CancellationFlow = (props: CancellationFlowProps) => {
  const { slug } = useParams()

  const [flowState, setFlowState] = useState<CancellationFlowState>(
    props.visible ? 'show-downgrade-modal' : 'closed'
  )
  useEffect(() => {
    setFlowState(props.visible ? 'show-downgrade-modal' : 'closed')
  }, [props.visible])

  const { data: membersExceededLimit, isLoading: projectLimitQueryLoading } =
    useFreeProjectLimitCheckQuery({ slug }, { enabled: flowState !== 'closed' })

  const { data: orgProjectsData, isLoading: orgProjectsQueryLoading } = useOrgProjectsInfiniteQuery(
    { slug },
    { enabled: flowState !== 'closed' }
  )

  const { data: subscription, isLoading: orgSubscriptionQueryLoading } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })

  const isLoading =
    projectLimitQueryLoading || orgProjectsQueryLoading || orgSubscriptionQueryLoading

  const orgProjects =
    useMemo(
      () => orgProjectsData?.pages.flatMap((page) => page.projects),
      [orgProjectsData?.pages]
    ) || []

  // [Joshen] Note that orgProjects is paginated so there's a chance this may omit certain projects
  // Although I don't foresee this affecting a majority of users. Ideally perhaps we could return
  // this data from the organization query
  const hasRunningProjects =
    orgProjects.filter((it) => it.status !== 'INACTIVE' && it.status !== 'GOING_DOWN').length > 0

  const hasMembersExceedingFreeTierLimit =
    (membersExceededLimit || []).length > 0 && hasRunningProjects

  const onConfirmDowngrade = () => {
    if (hasMembersExceedingFreeTierLimit) {
      setFlowState('show-downgrade-error')
    } else {
      setFlowState('show-exit-survey')
    }
  }

  const onCancelFlow = () => {
    setFlowState('closed')
    props.onCancel?.()
  }

  return (
    <>
      <DowngradeModal
        visible={flowState === 'show-downgrade-modal'}
        subscription={subscription}
        onClose={onCancelFlow}
        confirmDisabled={isLoading}
        onConfirm={onConfirmDowngrade}
        projects={orgProjects}
      />

      <MembersExceedLimitModal
        visible={flowState === 'show-downgrade-error'}
        onClose={onCancelFlow}
      />

      <ExitSurveyModal
        visible={flowState === 'show-exit-survey'}
        projects={orgProjects}
        onClose={(success?: boolean) => {
          if (success) {
            setFlowState('closed')
            props.onDowngrade?.()
          } else {
            onCancelFlow()
          }
        }}
      />
    </>
  )
}

type InitiateCancellationFlowButtonProps = Pick<
  ComponentProps<typeof ButtonTooltip>,
  'children' | 'variant'
>

export const InitiateCancellationFlowButton = (props: InitiateCancellationFlowButtonProps) => {
  const { slug } = useParams()
  const track = useTrack()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const isAwsManaged = selectedOrganization?.managed_by === MANAGED_BY.AWS_MARKETPLACE

  const { can: canUpdateSubscription } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })

  const isDowngradeablePlan = !subscription || ['pro', 'team'].includes(subscription.plan.id)

  const [visible, setVisible] = useState(false)

  const tooltipText = [
    [isAwsManaged, 'You cannot change the plan for an organization managed by AWS Marketplace.'],
    [!isDowngradeablePlan, 'Reach out to us via support to update your plan.'],
    [!canUpdateSubscription, "You need additional permissions to change your organization's plan."],
  ].find(([cond]) => cond)?.[1]

  return (
    <>
      <ButtonTooltip
        variant={props.variant}
        disabled={!isDowngradeablePlan || !canUpdateSubscription || isAwsManaged}
        tooltip={{
          content: {
            side: 'bottom',
            text: tooltipText,
          },
        }}
        onClick={() => {
          track('studio_billing_cancel_subscription_clicked', {
            currentPlan: subscription?.plan.id || 'free',
          })
          setVisible(true)
        }}
      >
        {props.children ?? 'Cancel Subscription'}
      </ButtonTooltip>

      <CancellationFlow
        onCancel={() => setVisible(false)}
        onDowngrade={() => setVisible(false)}
        visible={visible}
      />
    </>
  )
}
