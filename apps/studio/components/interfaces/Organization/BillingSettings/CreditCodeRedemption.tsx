import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

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

const FORM_ID = 'credit-code-redemption'

const FormSchema = z.object({
  code: z.coerce.string(),
})

type CreditCodeRedemptionForm = z.infer<typeof FormSchema>

export const CreditCodeRedemption = ({ slug }: { slug: string | undefined }) => {
  const { can: canRedeemCode, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const {
    mutateAsync: redeemCode,
    isPending: redeemingCode,
    error: errorRedeemingCode,
  } = useOrganizationCreditCodeRedemptionMutation({})

  const form = useForm<CreditCodeRedemptionForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
    },
  })

  const [codeRedemptionModalVisible, setCodeRedemptionModalVisible] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

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
              <p className="prose text-sm">Blaaaaaa</p>
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

                {errorRedeemingCode && (
                  <Alert_Shadcn_ variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle_Shadcn_>Error redeeming code</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      {errorRedeemingCode.message}
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
              </DialogSection>

              <DialogFooter>
                <Button htmlType="submit" type="primary" loading={redeemingCode}>
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
