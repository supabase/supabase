import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { FormMessage } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Modal } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Input } from '@ui/components/shadcn/ui/input'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCreateCollection } from 'data/analytics/warehouse-collections-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const CreateWarehouseCollectionModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { ref } = useParams()

  const canCreateCollection = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')

  const { mutate: createCollection, isLoading } = useCreateCollection({
    onSuccess: (data) => {
      // todo: remove typecast once api types are fixed
      setIsOpen(false)
      router.push(`/project/${ref}/logs/collections/${(data as any).token}`)
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
    if (!isOpen) {
      form.reset()
    }
  }, [isOpen, form])

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
    <>
      <ButtonTooltip
        type="default"
        disabled={!canCreateCollection}
        className="justify-start flex-grow w-full"
        icon={<PlusIcon size="14" />}
        onClick={() => setIsOpen(!isOpen)}
        tooltip={{
          content: {
            side: 'bottom',
            text: 'You need additional permissions to create collections',
          },
        }}
      >
        New collection
      </ButtonTooltip>
      {/* <Button onClick={() => setIsOpen(!isOpen)}>Create collection</Button> */}
      <Modal
        size="medium"
        onCancel={() => setIsOpen(!isOpen)}
        header="Create an event collection"
        visible={isOpen}
        hideFooter
      >
        <Form_Shadcn_ {...form}>
          <form onSubmit={onSubmit}>
            <Modal.Content className="py-4">
              <p className="pb-5 text-foreground-light text-sm">
                An event collection stores generic timeseries events and metadata in
                Supabase-managed analytics infrastructure. Events can be then be queried using SQL,
                without impacting transactional workloads.
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
              <Button size="tiny" type="default" onClick={() => setIsOpen(!isOpen)}>
                Cancel
              </Button>
              <Button size="tiny" loading={isLoading} disabled={isLoading} htmlType="submit">
                Create table
              </Button>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>
    </>
  )
}
