'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Input_Shadcn_ as Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { addPartnerMemberAction } from '@/app/protected/actions'

const addPartnerMemberSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['member', 'admin']),
})

type AddPartnerMemberValues = z.infer<typeof addPartnerMemberSchema>

type AddPartnerMemberFormProps = {
  partnerId: number
  partnerSlug: string
}

export function AddPartnerMemberForm({ partnerId, partnerSlug }: AddPartnerMemberFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldsDisabled = isPending

  const defaultValues: AddPartnerMemberValues = {
    email: '',
    role: 'member',
  }

  const form = useForm<AddPartnerMemberValues>({
    defaultValues,
  })
  const isDirty = form.formState.isDirty

  const onSubmit = (values: AddPartnerMemberValues) => {
    const parsed = addPartnerMemberSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof AddPartnerMemberValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('partnerId', String(partnerId))
    formData.set('partnerSlug', partnerSlug)
    formData.set('email', parsed.data.email)
    formData.set('role', parsed.data.role)

    startTransition(async () => {
      try {
        await addPartnerMemberAction(formData)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to add member'
        setError(message)
      }
    })
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setError(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Card>
          <CardContent>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="User email"
                  description="Member must already have a user account in this project."
                >
                  <FormControl className="col-span-8">
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="person@example.com"
                      required
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          <CardContent>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Role"
                  description="Admins can add members and manage partner settings."
                >
                  <FormControl className="col-span-8">
                    <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                      <RadioGroupStackedItem
                        value="member"
                        label="Member"
                        description="Can contribute items and work in partner workflows."
                        disabled={fieldsDisabled}
                      />
                      <RadioGroupStackedItem
                        value="admin"
                        label="Admin"
                        description="Can manage members and update partner configuration."
                        disabled={fieldsDisabled}
                      />
                    </RadioGroupStacked>
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          {error ? (
            <CardContent>
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          ) : null}

          <CardFooter className="justify-end gap-3">
            {isDirty && (
              <Button htmlType="button" variant="outline" onClick={handleCancel} disabled={fieldsDisabled}>
                Cancel
              </Button>
            )}
            <Button htmlType="submit" variant="outline" disabled={!isDirty || isPending}>
              {isPending ? 'Saving...' : 'Add or update member'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
