import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Alert, AlertDescription, AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useFlag } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertCircle, Calendar, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
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
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { useOrganizationCreditCodeRedemptionMutation } from '@/data/organizations/organization-credit-code-redemption-mutation'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import useLatest from '@/hooks/misc/useLatest'

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
  slug: string | undefined
  modalVisible?: boolean
  onClose?: () => void
}) => {
  const { can: canRedeemCode, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions',
    undefined,
    {
      organizationSlug: slug,
    }
  )

  const redeemCodeEnabled = useFlag('redeemCodeEnabled')

  const { data: org, isLoading: isOrgLoading } = useOrganizationQuery({ slug })

  const router = useRouter()

  const form = useForm<CreditCodeRedemptionForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
    },
  })

  const { data: customerProfile, isLoading: isCustomerProfileLoading } =
    useOrganizationCustomerProfileQuery({ slug })

  useEffect(() => {
    if (!router.isReady) return

    const queryCode = router.query.code
    const codeFromParams = Array.isArray(queryCode) ? queryCode[0] : queryCode

    if (typeof codeFromParams === 'string' && codeFromParams.trim().length > 2) {
      form.setValue('code', codeFromParams)
    }
  }, [router.isReady, router.query.code, form])

  const [codeRedemptionModalVisible, setCodeRedemptionModalVisible] = useState(
    modalVisible || false
  )
  const captchaRef = useRef<HCaptcha>(null)
  const captchaTokenRef = useRef<string | null>(null)

  const {
    mutateAsync: redeemCode,
    isPending: redeemingCode,
    error: errorRedeemingCode,
    data: codeRedemptionResult,
    reset: resetCodeRedemption,
  } = useOrganizationCreditCodeRedemptionMutation()

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

  useEffect(() => {
    if (codeRedemptionModalVisible) {
      initHcaptchaRef.current()
    }
  }, [codeRedemptionModalVisible, initHcaptchaRef])

  const onSubmit: SubmitHandler<CreditCodeRedemptionForm> = async ({ code }) => {
    const token = await initHcaptcha()

    await redeemCode(
      {
        slug,
        code,
        hcaptchaToken: token,
      },
      {
        onSuccess: () => {
          form.setValue('code', '')
          resetCaptcha()
        },
      }
    )
  }

  const onCodeRedemptionDialogVisibilityChange = (visible: boolean) => {
    setCodeRedemptionModalVisible(visible)
    if (!visible) {
      resetCodeRedemption()
      resetCaptcha()
      onClose?.()
    }
  }

  if (!redeemCodeEnabled) {
    return null
  }

  const codeRedemptionDisabled =
    !canRedeemCode || !isPermissionsLoaded || isOrgLoading || isCustomerProfileLoading

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

      <DialogContent onInteractOutside={(e) => e.preventDefault()} size={'large'}>
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

        {codeRedemptionResult ? (
          <div className="p-8">
            <div className="text-center flex items-center justify-center">
              <PartyPopper className="h-20 w-20" />
            </div>

            <div className="text-center">
              <p className="font-bold text-lg mt-2">Credits Redeemed!</p>
            </div>
            <Separator className="my-4" />
            <div className="flex w-full justify-center items-center">
              <div className="flex items-center space-x-1">
                <h4 className="opacity-50">$</h4>
                <h1 className="relative text-2xl">{codeRedemptionResult.amount_cents / 100}</h1>
                <h4 className="opacity-50"> credits applied</h4>
              </div>
            </div>

            {codeRedemptionResult.credits_expire_at && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 py-3 px-4 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span>
                  {'Expires on '}
                  {new Date(codeRedemptionResult.credits_expire_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {org?.plan.id === 'free' && (
              <div className="mt-4 space-y-4">
                <Separator />
                <Button className="w-full" size={'medium'} type="primary" asChild>
                  <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>
                    Upgrade Your Organization
                  </Link>
                </Button>
              </div>
            )}
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
                        <FormItemLayout label="Code" className="gap-1">
                          <Input_Shadcn_
                            {...field}
                            className="uppercase"
                            placeholder="ABCD-1234-EFGH-5678"
                          />
                        </FormItemLayout>
                      )}
                    />

                    {customerProfile && customerProfile.balance < 0 && (
                      <div className="mt-2 flex w-full justify-between items-center">
                        <span>Current Balance</span>
                        <div className="flex items-center space-x-1">
                          <h4 className="opacity-50">$</h4>
                          <h1 className="relative">{customerProfile.balance / -100}</h1>
                          <h4 className="opacity-50">/credits</h4>
                        </div>
                      </div>
                    )}

                    <Alert variant={'default'} className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Potential future charges</AlertTitle>
                      <AlertDescription>
                        Credits are applied to <strong>{org?.name}</strong> only and can't be shared
                        or transferred to other organizations. Credits are automatically used toward
                        invoices. When credits run out on a paid plan, your default payment method
                        will be charged—your plan won't be downgraded automatically.
                      </AlertDescription>
                    </Alert>

                    {errorRedeemingCode && (
                      <Alert_Shadcn_ variant="destructive">
                        <AlertCircle className="h-4 w-4 text-foreground-light" />
                        <AlertTitle_Shadcn_>Code cannot be redeemed</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          {errorRedeemingCode?.message}
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
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
