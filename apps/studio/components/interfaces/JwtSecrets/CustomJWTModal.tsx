import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { Eye, EyeOff, Key } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Input } from 'ui-patterns/DataInputs/Input'

const schema = z.object({
  secret: z
    .string({ required_error: `Please enter a custom JWT secret` })
    .min(32, { message: `Must be a minimum of 32 characters` })
    .regex(/^((?![@$]).)*$/, {
      message: `Secret cannot contain '@' or '$'`,
    }),
})

const formId = 'custom-jwt-form'

interface CustomJWTModalProps {
  visible: boolean
  onSubmit: SubmitHandler<z.infer<typeof schema>>
  onClose: () => void
}

export const CustomJWTModal = ({ visible, onSubmit, onClose }: CustomJWTModalProps) => {
  const [hidden, setHidden] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { secret: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pick a new JWT secret</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-2">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <p className="text-sm text-foreground-light">
                Pick a new custom JWT secret. Make sure it is a strong combination of characters
                that cannot be guessed easily.
              </p>
              <FormField_Shadcn_
                key="secret"
                name="secret"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="secret"
                    label="Custom JWT secret"
                    description="Minimally 32 characters long, '@' and '$' are not allowed."
                  >
                    <FormControl_Shadcn_>
                      <Input
                        id="secret"
                        className="w-full text-left"
                        type={hidden ? 'text' : 'password'}
                        icon={<Key />}
                        {...field}
                        actions={
                          <div className="flex items-center justify-center mr-1">
                            <Button
                              type="default"
                              icon={hidden ? <Eye /> : <EyeOff />}
                              onClick={() => setHidden((prev) => !prev)}
                            />
                          </div>
                        }
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isSubmitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isSubmitting}>
            Proceed to final confirmation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
