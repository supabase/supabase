import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { Input as DataInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

export const RecoverAccountWizard = () => {
  return (
    <div className="flex flex-col gap-4">
      <GistSection />
      <RecoverAccountForm />
    </div>
  )
}

const GistSection = () => {
  // TODO: We receive a token in the URL hash fragment. Find out how to use it and how to get the gist content
  const gistContent = 'supabase-account-recovery-de6aa90f6ddd365d05341dd1390'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-sm flex gap-2 items-center wrap-break-word">
        Publish a gist
      </p>
      <p className="text-sm text-foreground-light">
        Publish a <strong>public</strong> gist on the Github account linked to your Supabase
        account, with exactly this content:
      </p>
      <DataInput containerClassName="w-full" readOnly copy value={gistContent} />
    </div>
  )
}

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

type CodeFormData = z.infer<typeof codeSchema>

const RecoverAccountForm = () => {
  const [isLoading, setIsLoading] = useState(false)

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const onCodeEntered: SubmitHandler<CodeFormData> = async () => {
    setIsLoading(true)

    // This fixes a race condition where the user is redirected to the reset password page without the session being set
    // which causes the user to be redirected to /sign-in page even though he's signed in
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)

    // if (error) {
    //   setIsLoading(false)
    //   toast.error(`Failed to verify code: ${error.message}`)
    // } else {
    //   if (user?.factors?.length) {
    //     await router.push({
    //       pathname: '/forgot-password-mfa',
    //       query: router.query,
    //     })
    //   } else {
    //     await router.push({
    //       pathname: '/reset-password',
    //       query: router.query,
    //     })
    //   }
    // }
  }

  return (
    <Form {...codeForm}>
      <form
        id="code-input-form"
        method="POST"
        className="flex flex-col pt-4 space-y-4"
        onSubmit={codeForm.handleSubmit(onCodeEntered)}
      >
        <FormField
          control={codeForm.control}
          name="code"
          render={({ field }) => (
            <FormItemLayout label="Code" description="Enter the code we emailed you">
              <FormControl>
                <Input {...field} placeholder="123456" autoComplete="off" disabled={isLoading} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <Button block form="code-input-form" type="submit" size="medium" loading={isLoading}>
          Verify
        </Button>
      </form>
    </Form>
  )
}
