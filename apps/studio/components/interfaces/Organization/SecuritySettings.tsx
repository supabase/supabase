import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationMfaToggleMutation } from 'data/organizations/organization-mfa-mutation'
import { useOrganizationMfaQuery } from 'data/organizations/organization-mfa-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import {
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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const schema = z.object({
  enforceMfa: z.boolean(),
})

export const SecuritySettings = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })

  const { can: canReadMfaConfig, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'organizations'
  )
  const { can: canUpdateMfaConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )
  const { mutate: sendEvent } = useSendEventMutation()

  const isPaidPlan = selectedOrganization?.plan.id !== 'free'

  const {
    data: mfaConfig,
    error: mfaError,
    isPending: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug }, { enabled: isPaidPlan && canReadMfaConfig })

  const { mutate: toggleMfa, isPending: isUpdatingMfa } = useOrganizationMfaToggleMutation({
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

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        {!isPaidPlan ? (
          <UpgradeToPro
            source="organizationMfa"
            primaryText="Organization MFA enforcement is not available on Free Plan"
            secondaryText="Upgrade to Pro or above to enforce MFA requirements for your organization."
            featureProposition="enforce MFA requirements"
          />
        ) : (
          <>
            {isLoadingMfa || isLoadingPermissions ? (
              <Card>
                <CardContent>
                  <GenericSkeletonLoader />
                </CardContent>
              </Card>
            ) : !canReadMfaConfig ? (
              <NoPermission resourceText="view organization security settings" />
            ) : null}

            {(isErrorMfa || mfaError) && isPaidPlan && (
              <AlertError error={mfaError} subject="Failed to retrieve MFA enforcement status" />
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
                                </TooltipTrigger>
                                {(!canUpdateMfaConfig || !hasMFAEnabled) && (
                                  <TooltipContent side="bottom">
                                    {!canUpdateMfaConfig ? (
                                      "You don't have permission to update MFA settings"
                                    ) : (
                                      <>
                                        <InlineLink href="/account/security">Enable MFA</InlineLink>{' '}
                                        on your own account first
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
          </>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
