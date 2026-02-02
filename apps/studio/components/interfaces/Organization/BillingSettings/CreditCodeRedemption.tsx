import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Alert, AlertDescription, AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useFlag } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { useOrganizationPreviewCreditCodeQuery } from '@/data/organizations/organization-credit-code-preview-query'
import { useOrganizationCreditCodeRedemptionMutation } from '@/data/organizations/organization-credit-code-redemption-mutation'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import useLatest from '@/hooks/misc/useLatest'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const FORM_ID = 'credit-code-redemption'

const FormSchema = z.object({
  code: z.coerce.string(),
})

type CreditCodeRedemptionForm = z.infer<typeof FormSchema>

export const CreditCodeRedemption = ({
  slug,
  modalVisible = false,
}: {
  slug: string | undefined
  modalVisible?: boolean
}) => {
  const { can: canRedeemCode, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const redeemCodeEnabled = useFlag('redeemCodeEnabled')

  const { data: org, isLoading: isOrgLoading } = useSelectedOrganizationQuery({})

  const router = useRouter()

  const form = useForm<CreditCodeRedemptionForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
    },
  })

  const { data: customerProfile, isLoading: isCustomerProfileLoading } =
    useOrganizationCustomerProfileQuery({ slug })

  const watchedCode = form.watch('code')
  const [debouncedCode, setDebouncedCode] = useState(watchedCode)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedCode(watchedCode), 400)
    return () => clearTimeout(handle)
  }, [watchedCode])

  const { data: codePreview, error: errorCodePreview } = useOrganizationPreviewCreditCodeQuery(
    {
      slug,
      code: debouncedCode,
    },
    {
      // Avoid firing on initial mount and only when code is present
      enabled: !!debouncedCode && debouncedCode.trim().length > 2,
      refetchOnWindowFocus: false,
    }
  )

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
  } = useOrganizationCreditCodeRedemptionMutation({
    onSuccess: () => {
      setCodeRedemptionModalVisible(false)
      toast.success('Code redeemed successfully!')
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
        code: form.getValues('code'),
        hcaptchaToken: token,
      },
      {
        onSuccess: (data) => {
          resetCaptcha()
        },
      }
    )
  }

  const onCodeRedemptionDialogVisibilityChange = (visible: boolean) => {
    setCodeRedemptionModalVisible(visible)
    if (!visible) {
      resetCaptcha()
    }
  }

  if (!redeemCodeEnabled) {
    return null
  }

  return (
    <Dialog open={codeRedemptionModalVisible} onOpenChange={onCodeRedemptionDialogVisibilityChange}>
      {!modalVisible && (
        <DialogTrigger asChild>
          <ButtonTooltip
            type="default"
            className="pointer-events-auto"
            disabled={
              !canRedeemCode || !isPermissionsLoaded || isOrgLoading || isCustomerProfileLoading
            }
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
        <DialogHeader>
          <DialogTitle>Redeem Code</DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="prose text-sm">
              Redeem your credit code to add credits to your organization
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          {isOrgLoading || isCustomerProfileLoading ? (
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
                      <Input_Shadcn_ {...field} className="uppercase" />
                    </FormItemLayout>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 border-t pt-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground-lighter">
                      Current Balance
                    </span>
                    {customerProfile ? (
                      <p className="text-2xl font-medium">${customerProfile?.balance / -100}</p>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground-lighter">New Balance</span>

                    <p className="text-2xl font-medium">
                      {' '}
                      {codePreview && customerProfile
                        ? '$' + (customerProfile?.balance / -100 + codePreview.amount_cents / 100)
                        : '-'}
                    </p>
                  </div>
                </div>

                <Alert variant={'default'} className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Potential charges</AlertTitle>
                  <AlertDescription>
                    <p>
                      The credits will be applied to your organization "{org?.name}" and cannot be
                      used across other organizations you may have.
                    </p>
                    <p className="mt-1">
                      Credits are used whenever invoices are issued. Once you run out of credits,
                      your default payment method will be charged for future invoices. You will not
                      be downgraded automatically.
                    </p>
                  </AlertDescription>
                </Alert>

                {(errorRedeemingCode || errorCodePreview) && (
                  <Alert_Shadcn_ variant="destructive">
                    <AlertCircle className="h-4 w-4 text-foreground-light" />
                    <AlertTitle_Shadcn_>Code cannot be redeemed</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      {errorRedeemingCode?.message || errorCodePreview?.message}
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
              </DialogSection>

              <DialogFooter>
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={redeemingCode}
                  disabled={!codePreview}
                >
                  Redeem
                </Button>
              </DialogFooter>
            </form>
          )}
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
