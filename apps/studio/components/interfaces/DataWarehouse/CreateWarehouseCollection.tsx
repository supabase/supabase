import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { FormMessage } from '@ui/components/shadcn/ui/form'
import { Input } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { useCreateCollection } from 'data/analytics/warehouse-collections-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Modal } from 'ui'
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

  const FormSchema = z.object({
    name: z.string().min(1),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
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
    })
  })

  return (
    <Modal
      size="medium"
      onCancel={() => onOpenChange(false)}
      header="Create an event collection"
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

            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout label="Collection name" layout="horizontal">
                  <FormControl_Shadcn_>
                    <Input placeholder="Events" {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormMessage />
          </Modal.Content>

          <Modal.Content className="py-4 border-t flex items-center justify-end gap-2">
            <Button size="tiny" type="default" onClick={() => onOpenChange(false)}>
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
