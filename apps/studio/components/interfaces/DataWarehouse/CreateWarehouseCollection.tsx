import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { useCreateCollection } from 'data/analytics/warehouse-collections-create-mutation'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export const CreateWarehouseCollectionModal = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const router = useRouter()
  const { ref } = useParams()
  const { plan, isLoading: planLoading } = useCurrentOrgPlan()
  const currentOrg = useSelectedOrganization()

  const { mutate: createCollection, isLoading } = useCreateCollection({
    onSuccess: (data) => {
      onOpenChange(false)
      toast.success('Collection created successfully')
      router.push(`/project/${ref}/logs/collections/${data.token}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function getMaxRetentionDays() {
    if (planLoading) return 1
    if (plan?.id === 'free') return 3
    else return 90
  }
  const FormSchema = z.object({
    name: z.string().min(1),
    retention_days: z.coerce
      .number()
      .min(1)
      .max(getMaxRetentionDays())
      .multipleOf(1)
      .positive()
      .int(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      retention_days: getMaxRetentionDays(),
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = form.handleSubmit(async (vals) => {
    if (!ref) {
      toast.error('Project ref not found')
      return
    }
    createCollection({
      projectRef: ref,
      name: vals.name,
      retention_days: vals.retention_days,
    })
  })

  const formatDays = (days: number) => {
    if (days === 1) return `1 day`
    return `${days} days`
  }
  const retentionDescription = (days: number) => {
    const maxRetentionDays = getMaxRetentionDays()
    if (planLoading) return ''
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
    <Modal
      size="medium"
      onCancel={() => onOpenChange(false)}
      header="Create collection"
      visible={open}
      hideFooter
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={onSubmit}>
          <Modal.Content className="py-4">
            <p className="pb-5 text-foreground-light text-sm">
              An event collection stores time-based data and related information in Supabase's
              analytics system. You can use SQL to analyze this data without affecting the
              performance of your main database operations.
            </p>
            <div className="space-y-3">
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
            </div>
            <FormMessage_Shadcn_ />
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
          <Modal.Content className="py-4 border-t flex items-center justify-end gap-2">
            <Button size="tiny" type="default" onClick={() => onOpenChange(!open)}>
              Cancel
            </Button>
            <Button size="tiny" loading={isLoading} disabled={isLoading} htmlType="submit">
              Create collection
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
