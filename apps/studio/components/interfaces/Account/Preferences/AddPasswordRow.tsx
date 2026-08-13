import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { Input as InputWithActions } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import PasswordConditionsHelper from '@/components/interfaces/SignIn/PasswordConditionsHelper'
import { IdentityProviderIcon } from '@/components/ui/ProviderIcon'
import { useSetPasswordMutation } from '@/data/profile/profile-set-password-mutation'
import { getProviderDisplay } from '@/lib/external-identity-providers'
import { passwordValidation } from '@/lib/password-validation'

const FORM_ID = 'add-password-form'
const EMAIL_INPUT_ID = 'add-password-email'

const FormSchema = z.object({ password: passwordValidation })
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { password: '' }

/**
 * Offers a user without an email identity (OAuth-only account) a way to create one by setting a
 * password.
 *
 * Auth creates the email identity for the user's current email when the password is
 * saved.
 */
export const AddPasswordRow = ({ email }: { email: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const providerDisplay = getProviderDisplay('email')

  return (
    <>
      <CardContent className="flex justify-between items-center py-4">
        <div className="flex gap-x-4">
          <IdentityProviderIcon display={providerDisplay} size={30} />
          <div>
            <p className="text-sm">{providerDisplay.displayName}</p>
            <p className="text-sm text-foreground-lighter">{email}</p>
          </div>
        </div>
        <Button variant="default" onClick={() => setIsDialogOpen(true)}>
          Add password
        </Button>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader className="border-b">
            <DialogTitle>Add password</DialogTitle>
          </DialogHeader>
          <AddPasswordForm email={email} onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

const AddPasswordForm = ({ email, onClose }: { email: string; onClose: () => void }) => {
  const [passwordHidden, setPasswordHidden] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  })
  const password = useWatch({ control: form.control, name: 'password' })

  const { mutate: setPassword, isPending } = useSetPasswordMutation({
    onSuccess: () => {
      toast.success('Password added successfully')
      onClose()
    },
  })

  const onSubmit = (values: FormValues) => setPassword({ password: values.password })

  return (
    <Form {...form}>
      <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <DialogSection className="flex flex-col gap-y-4">
          <FormItemLayout
            isReactForm={false}
            id={EMAIL_INPUT_ID}
            label="Email"
            description="Adding a password lets you sign in with this email address"
          >
            <Input id={EMAIL_INPUT_ID} disabled value={email} />
          </FormItemLayout>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItemLayout label="Password">
                <FormControl>
                  <InputWithActions
                    id="password"
                    type={passwordHidden ? 'password' : 'text'}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    disabled={isPending}
                    autoComplete="new-password"
                    actions={
                      <Button
                        icon={passwordHidden ? <Eye /> : <EyeOff />}
                        variant="default"
                        className="w-7"
                        onClick={() => setPasswordHidden((prev) => !prev)}
                      />
                    }
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      setPasswordHidden(true)
                    }}
                  />
                </FormControl>
              </FormItemLayout>
            )}
          />

          <PasswordConditionsHelper password={password} />
        </DialogSection>

        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={isPending}>
            Add password
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
