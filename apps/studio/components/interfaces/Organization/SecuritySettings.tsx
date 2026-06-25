import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Switch } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import AlertError from '@/components/ui/AlertError'
import NoPermission from '@/components/ui/NoPermission'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useOrganizationMfaToggleMutation } from '@/data/organizations/organization-mfa-mutation'
import { useOrganizationMfaQuery } from '@/data/organizations/organization-mfa-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'

const schema = z.object({
  enforceMfa: z.boolean(),
})

export const SecuritySettings = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const {
    data: members,
    error: membersError,
    isPending: isLoadingMembers,
    isError: isMembersError,
    isSuccess: isSuccessMembers,
  } = useOrganizationMembersQuery({ slug })

  const { can: canReadMfaConfig, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'organizations'
  )
  const { can: canUpdateMfaConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )
  const track = useTrack()

  const { hasAccess: hasAccessToEnforceMfa, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('security.enforce_mfa')

  const {
    data: mfaConfig,
    error: mfaError,
    isPending: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug }, { enabled: hasAccessToEnforceMfa && canReadMfaConfig })

  const { mutate: toggleMfa, isPending: isUpdatingMfa } = useOrganizationMfaToggleMutation({
    onError: (error) => {
      toast.error(`Failed to update MFA enforcement: ${error.message}`)
      if (mfaConfig !== undefined) form.reset({ enforceMfa: mfaConfig })
    },
    onSuccess: (data) => {
      toast.success('Successfully updated organization MFA settings')
      track('organization_mfa_enforcement_updated', { mfaEnforced: data.enforced })
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
    members?.find((member) => member.primary_email == profile?.primary_email)?.mfa_enabled ?? false

  const requiresPersonalMfa = isSuccessMembers && canUpdateMfaConfig && !hasMFAEnabled

  const isLoadingMfaEnforcementSettings =
    isLoadingMfa || isLoadingPermissions || isLoadingEntitlement || isLoadingMembers
  const hasMfaConfigError = (isErrorMfa || Boolean(mfaError)) && hasAccessToEnforceMfa
  const canShowMfaEnforcementForm =
    isSuccessMfa && hasAccessToEnforceMfa && isSuccessMembers && !requiresPersonalMfa
  const isMfaEnforcementSwitchDisabled =
    !hasAccessToEnforceMfa || !canUpdateMfaConfig || isUpdatingMfa
  const isSaveMfaEnforcementDisabled =
    isMfaEnforcementSwitchDisabled || isLoadingMfa || !form.formState.isDirty

  const onSubmit = (values: { enforceMfa: boolean }) => {
    if (!slug || !hasAccessToEnforceMfa) return
    toggleMfa({ slug, setEnforced: values.enforceMfa })
  }

  return (
    <ScaffoldContainer size="small" className="px-6 xl:px-10">
      <ScaffoldSection isFullWidth>
        {!hasAccessToEnforceMfa && !isLoadingEntitlement ? (
          <UpgradeToPro
            source="organizationMfa"
            primaryText="Organization MFA enforcement is not available on Free Plan"
            secondaryText="Upgrade to Pro or above to enforce MFA requirements for your organization."
            featureProposition="enforce MFA requirements"
          />
        ) : (
          <>
            {isLoadingMfaEnforcementSettings ? (
              <Card>
                <CardContent>
                  <GenericSkeletonLoader />
                </CardContent>
              </Card>
            ) : !canReadMfaConfig ? (
              <NoPermission resourceText="view organization security settings" />
            ) : (
              requiresPersonalMfa && (
                <Admonition
                  type="note"
                  layout="horizontal"
                  title="Enable MFA on your account first"
                  description="You need to set up multi-factor authentication (MFA) on your own account before you can enforce it on your organization."
                  actions={
                    <Button asChild variant="default">
                      <Link href="/account/security">Set up MFA</Link>
                    </Button>
                  }
                />
              )
            )}

            {isMembersError && (
              <AlertError error={membersError} subject="Failed to retrieve organization members" />
            )}

            {hasMfaConfigError && (
              <AlertError error={mfaError} subject="Failed to retrieve MFA enforcement status" />
            )}

            {canShowMfaEnforcementForm && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Card>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="enforceMfa"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            className="justify-between"
                            label="Require MFA to access organization"
                            description="Team members must have MFA enabled and a valid MFA session to access the organization and any projects."
                          >
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isMfaEnforcementSwitchDisabled}
                              />
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="justify-end space-x-2">
                      {form.formState.isDirty && (
                        <Button
                          variant="default"
                          disabled={isLoadingMfa || isUpdatingMfa}
                          onClick={() =>
                            form.reset({ enforceMfa: hasAccessToEnforceMfa ? mfaConfig : false })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSaveMfaEnforcementDisabled}
                        loading={isUpdatingMfa}
                      >
                        Save
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
            )}
          </>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
