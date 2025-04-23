import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import AlertError from 'components/ui/AlertError'
import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import Panel from 'components/ui/Panel'
import { useOrganizationMfaQuery } from 'data/organizations/organization-mfa-query'
import { useOrganizationMfaToggleMutation } from 'data/organizations/organization-mfa-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useAppStateSnapshot } from 'state/app-state'

export interface EnforceMFAToggleProps {
  hasMFAEnabled: boolean
}

const EnforceMFAToggle = ({ hasMFAEnabled }: EnforceMFAToggleProps) => {
  const { slug } = useParams()
  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const {
    data: mfa,
    error: mfaError,
    isLoading: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug })
  const { mutate: sendToggle } = useOrganizationMfaToggleMutation()

  const snap = useAppStateSnapshot()
  snap.setIsMfaEnforced(mfa)
  const onToggleMfa = () => {
    const value = !snap.isMfaEnforced ? 'true' : 'false'
    snap.setIsMfaEnforced(value === 'true')
    sendToggle({ slug: slug, setEnforced: value === 'true' })
  }

  return (
    <>
      {isLoadingMfa && <GenericSkeletonLoader />}
      {isErrorMfa ? (
        mfaError.message.endsWith('upgrade to Pro, Team or Enterprise Plan to enforce MFA.') ? (
          <Alert_Shadcn_
            variant="default"
            title="Organization MFA enforcement is not available on the Free plan"
          >
            <WarningIcon />
            <div className="flex flex-col md:flex-row pt-1 gap-4">
              <div className="grow">
                <AlertTitle_Shadcn_>
                  Organization MFA enforcement is not available on the Free plan
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="flex flex-row justify-between gap-3">
                  <p>
                    Upgrade to Pro, Team, or Enterprise to enforce MFA for all members in your
                    organization.
                  </p>
                </AlertDescription_Shadcn_>
              </div>

              <div className="flex items-center">
                <Button type="primary" asChild>
                  <Link href={`/org/${slug}/billing?panel=subscriptionPlan&source=memberMFA`}>
                    Upgrade subscription
                  </Link>
                </Button>
              </div>
            </div>
          </Alert_Shadcn_>
        ) : (
          <AlertError error={mfaError} subject="Failed to retrieve MFA enforcement status" />
        )
      ) : null}
      {isSuccessMfa && (
        <Panel title={<h5 key="panel-title">Team Settings</h5>}>
          <Panel.Content>
            <Toggle
              checked={snap.isMfaEnforced}
              onChange={onToggleMfa}
              disabled={!canUpdateOrganization || !hasMFAEnabled}
              label="Require MFA to access organization"
              descriptionText="Team members must have MFA enabled and a valid MFA session to access the organization and any projects."
            />
            {!hasMFAEnabled && canUpdateOrganization && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild type="text" className="px-1">
                    <a target="_blank" rel="noreferrer" href="/dashboard/account/security">
                      <HelpCircle size={14} className="text-foreground-light" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Enable MFA on your own account first.</TooltipContent>
              </Tooltip>
            )}
          </Panel.Content>
        </Panel>
      )}
    </>
  )
}

export default EnforceMFAToggle
