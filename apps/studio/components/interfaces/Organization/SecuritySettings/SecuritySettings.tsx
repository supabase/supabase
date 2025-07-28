import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationMfaToggleMutation } from 'data/organizations/organization-mfa-mutation'
import { useOrganizationMfaQuery } from 'data/organizations/organization-mfa-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = z.object({
  enforceMfa: z.boolean(),
})

const SecuritySettings = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const canReadMfaConfig = useCheckPermissions(PermissionAction.READ, 'organizations')
  const canUpdateMfaConfig = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: sendEvent } = useSendEventMutation()

  const isPaidPlan = selectedOrganization?.plan.id !== 'free'

  const {
    data: mfaConfig,
    error: mfaError,
    isLoading: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug }, { enabled: canReadMfaConfig })

  const { mutate: toggleMfa, isLoading: isUpdatingMfa } = useOrganizationMfaToggleMutation({
    onError: (error) => {
      toast.error(`Failed to update MFA enforcement: ${error.message}`)
      if (mfaConfig !== undefined) form.reset({ enforceMfa: mfaConfig })
    },
    onSuccess: (data) => {
      toast.success('Successfully updated organization MFA settings')
      sendEvent({
        action: 'organization_mfa_enforcement_updated',
        properties: {
          mfaEnforced: data.enforced,
        },
        groups: {
          organization: slug ?? 'Unknown',
        },
      })
    },
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      enforceMfa: false,
    },
  })

  useEffect(() => {
    if (mfaConfig !== undefined) {
      form.reset({ enforceMfa: mfaConfig })
    }
  }, [mfaConfig, form])

  const hasMFAEnabled =
    members?.find((member) => member.primary_email == profile?.primary_email)?.mfa_enabled || false

  const onSubmit = (values: { enforceMfa: boolean }) => {
    if (!slug || !isPaidPlan) return
    toggleMfa({ slug, setEnforced: values.enforceMfa })
  }

  if (!canReadMfaConfig) {
    return (
      <ScaffoldContainerLegacy>
        <NoPermission resourceText="view organization security settings" />
      </ScaffoldContainerLegacy>
    )
  }

  return (
    <ScaffoldContainerLegacy>
      {!isPaidPlan && (
        <Alert_Shadcn_
          variant="default"
          title="Organization MFA enforcement is not available on Free plan"
        >
          <WarningIcon />
          <div className="flex flex-col md:flex-row pt-1 gap-4">
            <div className="grow">
              <AlertTitle_Shadcn_>
                Organization MFA enforcement is not available on Free plan
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-row justify-between gap-3">
                <p>Upgrade to Pro or above to enforce MFA requirements for your organization.</p>
              </AlertDescription_Shadcn_>
            </div>

            <div className="flex items-center">
              <Button type="primary" asChild>
                <Link href={`/org/${slug}/billing?panel=subscriptionPlan&source=mfa`}>
                  Upgrade subscription
                </Link>
              </Button>
            </div>
          </div>
        </Alert_Shadcn_>
      )}

      {(isErrorMfa || mfaError) && isPaidPlan && (
        <AlertError error={mfaError} subject="Failed to retrieve MFA enforcement status" />
      )}

      {isLoadingMfa && (
        <Card>
          <CardContent>
            <GenericSkeletonLoader />
          </CardContent>
        </Card>
      )}

      {isSuccessMfa && isPaidPlan && (
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="enforceMfa"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Require MFA to access organization"
                      description="Team members must have MFA enabled and a valid MFA session to access the organization and any projects."
                    >
                      <FormControl_Shadcn_>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !isPaidPlan ||
                                  !canUpdateMfaConfig ||
                                  !hasMFAEnabled ||
                                  isUpdatingMfa
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          {(!canUpdateMfaConfig || !hasMFAEnabled) && (
                            <TooltipContent side="bottom">
                              {!canUpdateMfaConfig ? (
                                "You don't have permission to update MFA settings"
                              ) : (
                                <>
                                  <InlineLink href="/account/security">Enable MFA</InlineLink> on
                                  your own account first
                                </>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                {form.formState.isDirty && (
                  <Button
                    type="default"
                    disabled={isLoadingMfa || isUpdatingMfa}
                    onClick={() => form.reset({ enforceMfa: isPaidPlan ? mfaConfig : false })}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !isPaidPlan ||
                    !canUpdateMfaConfig ||
                    isUpdatingMfa ||
                    isLoadingMfa ||
                    !form.formState.isDirty
                  }
                  loading={isUpdatingMfa}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      )}
    </ScaffoldContainerLegacy>
  )
}

export default SecuritySettings
