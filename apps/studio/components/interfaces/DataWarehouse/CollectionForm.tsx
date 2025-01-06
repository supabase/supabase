import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { Admonition } from 'ui-patterns'
import { useRouter } from 'next/router'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

export interface CollectionFormValues {
  name: string
  retention_days: number
}

interface CollectionFormProps {
  initialValues?: Partial<CollectionFormValues>
  onSubmit: (values: CollectionFormValues) => void
  isLoading?: boolean
  onCancelClick: () => void
}

export const CollectionForm = ({
  initialValues,
  onSubmit,
  isLoading,
  onCancelClick,
}: CollectionFormProps) => {
  const { plan, isLoading: planLoading } = useCurrentOrgPlan()
  const router = useRouter()
  const currentOrg = useSelectedOrganization()

  function getMaxRetentionDays() {
    if (planLoading) return 1
    if (plan?.id === 'free') return 3
    else return 90
  }
  const maxRetentionDays = getMaxRetentionDays()

  const FormSchema = z.object({
    name: z.string().min(1),
    retention_days: z.coerce.number().min(1).max(maxRetentionDays).multipleOf(1).positive().int(),
  })

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      retention_days: initialValues?.retention_days || maxRetentionDays,
    },
  })

  const handleSubmit = form.handleSubmit(onSubmit)

  const formatDays = (days: number) => {
    return days === 1 ? `1 day` : `${days} days`
  }

  const retentionDescription = (days: number) => {
    if (!Boolean(days) || days < 1)
      return <>Your plan allows for a maximum of {formatDays(maxRetentionDays)}.</>
    return (
      <>
        Your logs will be removed after {formatDays(days)}. <br />
        Your plan allows for a maximum of {formatDays(maxRetentionDays)}.
      </>
    )
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={handleSubmit}>
        <Modal.Content className="space-y-3">
          <FormField_Shadcn_
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout label="Collection name" layout="horizontal">
                <FormControl_Shadcn_>
                  <Input_Shadcn_ autoFocus placeholder="Events" {...field} />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
          <FormField_Shadcn_
            control={form.control}
            name="retention_days"
            render={({ field }) => (
              <FormItemLayout
                label="Retention"
                layout="horizontal"
                description={retentionDescription(Number(field.value))}
              >
                <FormControl_Shadcn_>
                  <div className="relative flex items-center gap-2">
                    <Input_Shadcn_ type="number" {...field} />
                    <span className="absolute right-3 text-foreground-lighter text-sm pointer-events-none">
                      days
                    </span>
                  </div>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        </Modal.Content>

        {plan?.id === 'free' && (
          <>
            <Modal.Separator />
            <Admonition
              className="border-none bg-transparent"
              type="default"
              title="Upgrade your plan to increase retention"
              description={
                <div>
                  Upgrade to the pro plan to increase retention to 90 days.
                  <Button
                    className="mt-2"
                    type="primary"
                    onClick={() =>
                      router.push(`/org/${currentOrg?.slug}/billing?panel=subscriptionPlan`)
                    }
                  >
                    Upgrade plan
                  </Button>
                </div>
              }
            />
          </>
        )}
        <FormMessage_Shadcn_ />
        <Modal.Content className="py-4 border-t flex items-center justify-end gap-2">
          <Button size="tiny" type="default" onClick={onCancelClick}>
            Cancel
          </Button>
          <Button size="tiny" loading={isLoading} disabled={isLoading} htmlType="submit">
            Create collection
          </Button>
        </Modal.Content>
      </form>
    </Form_Shadcn_>
  )
}
