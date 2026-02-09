import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Calendar, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Separator,
} from 'ui'
import { Admonition, ShimmeringLoader, TimestampInfo } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useOrganizationCreditCodeRedemptionMutation } from '@/data/organizations/organization-credit-code-redemption-mutation'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import { useLatest } from '@/hooks/misc/useLatest'

const FORM_ID = 'credit-code-redemption'

const FormSchema = z.object({
  code: z.coerce.string(),
})

type CreditCodeRedemptionForm = z.infer<typeof FormSchema>

export const CreditCodeRedemption = ({
  slug,
  modalVisible = false,
  onClose,
}: {
  slug?: string
  modalVisible?: boolean
  onClose?: () => void
}) => {
  const router = useRouter()
  const redeemCodeEnabled = useFlag('redeemCodeEnabled')
  const [codeRedemptionModalVisible, setCodeRedemptionModalVisible] = useState(
    modalVisible || false
  )

  const { data: org, isLoading: isOrgLoading } = useOrganizationQuery({ slug })
  const { data: customerProfile, isLoading: isCustomerProfileLoading } =
    useOrganizationCustomerProfileQuery({ slug })

  const { can: canRedeemCode, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions',
    undefined,
    { organizationSlug: slug }
  )

  const captchaRef = useRef<HCaptcha>(null)
  const captchaTokenRef = useRef<string | null>(null)
  const codeRedemptionDisabled =
    !canRedeemCode || !isPermissionsLoaded || isOrgLoading || isCustomerProfileLoading

  const form = useForm<CreditCodeRedemptionForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { code: '' },
  })

  const {
    mutate: redeemCode,
    isPending: redeemingCode,
    error: errorRedeemingCode,
    data: codeRedemptionResult,
    reset: resetCodeRedemption,
  } = useOrganizationCreditCodeRedemptionMutation({
    onSuccess: () => {
      form.setValue('code', '')
      resetCaptcha()
    },
  })

  const resetCaptcha = () => {
    captchaTokenRef.current = null
    captchaRef.current?.resetCaptcha()
  }

  const initHcaptcha = async () => {
    let token = captchaTokenRef.current

    try {
      if (!token) {
        const captchaResponse = await captchaRef.current?.execute({ async: true })
        token = captchaResponse?.response ?? null
        captchaTokenRef.current = token
        return token
      }
    } catch (error) {
      return token
    }

    return token
  }
  const initHcaptchaRef = useLatest(initHcaptcha)

  const onSubmit: SubmitHandler<CreditCodeRedemptionForm> = async ({ code }) => {
    const token = await initHcaptcha()
    redeemCode({ slug, code, hcaptchaToken: token })
  }

  const onCodeRedemptionDialogVisibilityChange = (visible: boolean) => {
    setCodeRedemptionModalVisible(visible)
    if (!visible) {
      resetCodeRedemption()
      resetCaptcha()
      onClose?.()
    }
  }

  useEffect(() => {
    if (!router.isReady) return

    const queryCode = router.query.code
    const codeFromParams = Array.isArray(queryCode) ? queryCode[0] : queryCode

    if (typeof codeFromParams === 'string' && codeFromParams.trim().length > 2) {
      form.setValue('code', codeFromParams)
    }
  }, [router.isReady, router.query.code, form])

  useEffect(() => {
    if (codeRedemptionModalVisible) {
      initHcaptchaRef.current()
    }
  }, [codeRedemptionModalVisible, initHcaptchaRef])

  if (!redeemCodeEnabled) return null

  return (
    <Dialog open={codeRedemptionModalVisible} onOpenChange={onCodeRedemptionDialogVisibilityChange}>
      {!modalVisible && (
        <DialogTrigger asChild>
          <ButtonTooltip
            type="default"
            className="pointer-events-auto"
            disabled={codeRedemptionDisabled}
            tooltip={{
              content: {
                side: 'bottom',
                text:
                  isPermissionsLoaded && !canRedeemCode
                    ? 'You need additional permissions to redeem codes'
                    : undefined,
              },
            }}
          >
            Redeem Code
          </ButtonTooltip>
        </DialogTrigger>
      )}

      <DialogContent size="medium" onInteractOutside={(e) => e.preventDefault()}>
        <HCaptcha
          ref={captchaRef}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          size="invisible"
          onOpen={() => {
            // [Joshen] This is to ensure that hCaptcha popup remains clickable
            if (document !== undefined) document.body.classList.add('!pointer-events-auto')
          }}
          onClose={() => {
            if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
          }}
          onVerify={(token) => {
            captchaTokenRef.current = token
            if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
          }}
          onExpire={() => {
            captchaTokenRef.current = null
          }}
        />

        {!!codeRedemptionResult ? (
          <div className="p-8">
            <div className="text-center flex items-center justify-center">
              <PartyPopper strokeWidth={1} className="h-14 w-14" />
            </div>

            <div className="text-center">
              <p className=" text-lg mt-2">Credits redeemed!</p>
            </div>
            <Separator className="my-4" />
            <div className="flex w-full justify-center items-center">
              <div className="flex items-center space-x-1">
                <p className="opacity-50 text-sm">$</p>
                <p className="text-2xl">{codeRedemptionResult.amount_cents / 100}</p>
                <p className="opacity-50 text-sm"> credits applied</p>
              </div>
            </div>

            {codeRedemptionResult.credits_expire_at && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 py-3 px-4 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span>
                  Expires on{' '}
                  <TimestampInfo
                    className="text-sm"
                    utcTimestamp={codeRedemptionResult.credits_expire_at}
                    labelFormat="MMMM DD, YYYY"
                  />
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-y-4">
              <Separator />
              <div className="flex justify-center items-center gap-x-2">
                {org?.plan.id === 'free' && (
                  <UpgradePlanButton plan="Pro" source="code-redeem" slug={org.slug}>
                    Upgrade organization
                  </UpgradePlanButton>
                )}
                <Button asChild type="default">
                  <Link href={`/org/${org?.slug}`}>Go to organization</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Redeem Code</DialogTitle>
              <DialogDescription className="space-y-2">
                Redeem your credit code to add credits to your organization
              </DialogDescription>
            </DialogHeader>

            <DialogSectionSeparator />

            <Form_Shadcn_ {...form}>
              {isOrgLoading || isCustomerProfileLoading || !isPermissionsLoaded ? (
                <div className="p-6 space-y-4">
                  <ShimmeringLoader />
                  <div className="flex space-x-4">
                    <ShimmeringLoader className="w-1/2" />
                    <ShimmeringLoader className="w-1/2" />
                  </div>
                </div>
              ) : (
                <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogSection className="flex flex-col gap-2">
                    <FormField_Shadcn_
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItemLayout label="Code" className="gap-1" layout="horizontal">
                          <Input_Shadcn_
                            {...field}
                            className="uppercase w-56 ml-auto"
                            placeholder="ABCD-1234-EFGH-5678"
                          />
                        </FormItemLayout>
                      )}
                    />

                    {customerProfile && customerProfile.balance < 0 && (
                      <div className="flex w-full justify-between items-center">
                        <span className="text-sm">Current Balance</span>
                        <div className="flex items-center gap-x-1">
                          <p className="opacity-50 text-sm">$</p>
                          <p className="text-2xl">{customerProfile.balance / -100}</p>
                          <p className="opacity-50 text-sm">/credits</p>
                        </div>
                      </div>
                    )}

                    <Admonition type="note" title="Potential future charges">
                      <p>
                        Credits are applied to <strong>{org?.name}</strong> only and cannot be
                        shared or transferred to other organizations. Credits are automatically used
                        toward invoices.
                      </p>
                      <p className="mt-2">
                        When credits run out on a paid plan, your default payment method will be
                        charged—your plan won't be downgraded automatically.
                      </p>
                    </Admonition>

                    {errorRedeemingCode && (
                      <Admonition
                        type="warning"
                        title="Unable to redeem code"
                        description={errorRedeemingCode?.message}
                      />
                    )}
                  </DialogSection>

                  <DialogFooter>
                    <ButtonTooltip
                      type="primary"
                      className="pointer-events-auto"
                      loading={redeemingCode}
                      disabled={codeRedemptionDisabled}
                      htmlType="submit"
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text:
                            isPermissionsLoaded && !canRedeemCode
                              ? 'You need additional permissions to redeem codes'
                              : undefined,
                        },
                      }}
                    >
                      Redeem
                    </ButtonTooltip>
                  </DialogFooter>
                </form>
              )}
            </Form_Shadcn_>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
