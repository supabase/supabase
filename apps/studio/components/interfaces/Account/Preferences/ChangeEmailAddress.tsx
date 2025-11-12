import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { InlineLink } from 'components/ui/InlineLink'
import { useEmailUpdateMutation } from 'data/profile/profile-update-email-mutation'
import {
  Button,
  DialogFooter,
  DialogSection,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export const GitHubChangeEmailAddress = () => {
  return (
    <DialogSection className="flex flex-col gap-y-2">
      <p className="text-sm">
        Email addresses for GitHub identities should be updated through GitHub
      </p>
      <ol className="flex flex-col gap-y-0.5 text-sm ml-4 pl-2 list-decimal text-foreground-light">
        <li>Log out of Supabase</li>
        <li>
          Change your Primary Email in{' '}
          <InlineLink href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/changing-your-primary-email-address">
            GitHub
          </InlineLink>{' '}
          (your primary email)
        </li>
        <li>Log out of GitHub</li>
        <li>Log back into GitHub (with the new, desired email set as primary)</li>
        <li>Log back into Supabase</li>
      </ol>
    </DialogSection>
  )
}

export const SSOChangeEmailAddress = () => {
  return (
    <DialogSection className="flex flex-col gap-y-2">
      <p className="text-sm">
        Email addresses for SSO should be updated through your identity provider
      </p>
      <ol className="flex flex-col gap-y-0.5 text-sm ml-4 pl-2 list-decimal text-foreground-light">
        <li>Contact the owner / admin for your team to change your email</li>
      </ol>
    </DialogSection>
  )
}

export const ChangeEmailAddressForm = ({ onClose }: { onClose: () => void }) => {
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const FormSchema = z.object({ email: z.string().email() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '' },
  })

  const { mutate: updateEmail, isLoading } = useEmailUpdateMutation({
    onSuccess: (_, vars) => {
      toast.success(
        `A confirmation email has been sent to ${vars.email}. Please confirm the change within 10 minutes.`
      )
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to update email: ${error.message}`)
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    updateEmail({ email: values.email, hcaptchaToken: token ?? null })
  }

  return (
    <Form_Shadcn_ {...form}>
      <form id="update-email-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="self-center">
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size="invisible"
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>

        <DialogSection>
          <FormField_Shadcn_
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout
                label="Provide a new email address"
                description="A confirmation email will be sent to the provided email address"
              >
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} placeholder="example@email.com" />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        </DialogSection>

        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button htmlType="submit" loading={isLoading} disabled={isLoading}>
            Confirm
          </Button>
        </DialogFooter>
      </form>
    </Form_Shadcn_>
  )
}
