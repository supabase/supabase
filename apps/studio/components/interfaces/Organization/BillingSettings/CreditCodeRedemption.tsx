import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/router'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useOrganizationCreditCodeRedemptionMutation } from '@/data/organizations/organization-credit-code-redemption-mutation'
import { toast } from 'sonner'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationPreviewCreditCodeQuery } from '@/data/organizations/organization-credit-code-preview-query'

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

  const router = useRouter()

  const form = useForm<CreditCodeRedemptionForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
    },
  })

  const { data: customerProfile, isLoading: isCustomerProfileLoading } =
    useOrganizationCustomerProfileQuery({ slug })

  console.log(customerProfile)

  const watchedCode = form.watch('code')
  const [debouncedCode, setDebouncedCode] = useState(watchedCode)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedCode(watchedCode), 250)
    return () => clearTimeout(handle)
  }, [watchedCode])

  const {
    data: codePreview,
    isLoading: isLoadingCodePreview,
    error: errorCodePreview,
    isSuccess: codePreviewSuccessful,
  } = useOrganizationPreviewCreditCodeQuery(
    {
      slug,
      code: debouncedCode,
    },
    {
      // Avoid firing on initial mount and only when code is present
      enabled: !!debouncedCode && debouncedCode.trim().length > 0,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (!router.isReady) return

    const queryCode = router.query.code
    const codeFromParams = Array.isArray(queryCode) ? queryCode[0] : queryCode

    if (typeof codeFromParams === 'string' && codeFromParams.trim().length > 0) {
      form.setValue('code', codeFromParams)
    }
  }, [router.isReady, router.query.code, form])

  const [codeRedemptionModalVisible, setCodeRedemptionModalVisible] = useState(
    modalVisible || false
  )
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

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

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  const initHcaptcha = async () => {
    if (codeRedemptionModalVisible && captchaRef) {
      let token = captchaToken

      try {
        if (!token) {
          const captchaResponse = await captchaRef.execute({ async: true })
          token = captchaResponse?.response ?? null
          setCaptchaToken(token)
          return token
        }
      } catch (error) {
        return token
      }

      return token
    }
  }

  useEffect(() => {
    initHcaptcha()
  }, [codeRedemptionModalVisible, captchaRef])

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
      setCaptchaRef(null)
    }
  }

  return (
    <div className="flex items-center justify-end py-4 px-8">
      <Dialog
        open={codeRedemptionModalVisible}
        onOpenChange={(open) => onCodeRedemptionDialogVisibilityChange(open)}
      >
        {!modalVisible && (
          <DialogTrigger asChild>
            <ButtonTooltip
              type="default"
              className="pointer-events-auto"
              disabled={!canRedeemCode || !isPermissionsLoaded}
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

        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <HCaptcha
            ref={captchaRefCallback}
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
              setCaptchaToken(token)
              if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
            }}
            onExpire={() => {
              setCaptchaToken(null)
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
                    <p className="text-2xl font-medium">${customerProfile?.balance / -100}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground-lighter">New Balance</span>

                    <p className="text-2xl font-medium">
                      {' '}
                      {codePreview
                        ? '$' + (customerProfile?.balance / -100 + codePreview.amount_cents / 100)
                        : '-'}
                    </p>
                  </div>
                </div>

                {(errorRedeemingCode || errorCodePreview) && (
                  <Alert_Shadcn_ variant="destructive">
                    <AlertCircle className="h-4 w-4" />
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
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>
    </div>
  )
}
