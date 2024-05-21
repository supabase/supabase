import { useParams } from 'common'
import { useCreateCollection } from 'data/analytics'
import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Input, Modal } from 'ui'

export const CreateWarehouseCollectionModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { ref } = useParams()

  const { mutateAsync: createCollection, isLoading } = useCreateCollection({
    onSuccess: (data) => {
      router.push(`/project/${ref}/logs/collections/${data?.token}`)
    },
  })

  return (
    <>
      <Button
        type="default"
        className="justify-start flex-grow w-full"
        icon={<PlusIcon size="14" />}
        onClick={() => setIsOpen(!isOpen)}
      >
        New collection
      </Button>
      <Modal
        size="medium"
        onCancel={() => setIsOpen(!isOpen)}
        header="Create an event collection"
        visible={isOpen}
        hideFooter
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              const formData = new FormData(e.target as HTMLFormElement)
              const values = {
                name: formData.get('name') as string,
              }
              if (!ref) {
                toast.error('Project ref not found')
                return
              }
              await createCollection({
                projectRef: ref,
                name: values.name,
              })
              toast.success(`Collection ${values.name} created`)
            } catch (error) {
              console.error(error)
              toast.error(`Failed to create collection. Check the console for more details.`)
            } finally {
              setIsOpen(false)
            }
          }}
        >
          <div className="py-4">
            <Modal.Content>
              <p className="pb-5 text-scale-1100 text-sm">
                An event collection stores generic timeseries events and metadata in
                Supabase-managed analytics infrastructure. Events can be then be queried using SQL,
                without impacting transactional workloads.
              </p>
              <div className="space-y-6">
                <Input
                  required
                  layout="horizontal"
                  label="Collection name"
                  id="name"
                  name="name"
                  autoComplete="off"
                />
              </div>
            </Modal.Content>
          </div>
          <div className="py-3 border-t bg-surface-100">
            <Modal.Content>
              <div className="flex items-center justify-end gap-2">
                <Button size="tiny" type="default" onClick={() => setIsOpen(!isOpen)}>
                  Cancel
                </Button>
                <Button size="tiny" loading={isLoading} disabled={isLoading} htmlType="submit">
                  Create table
                </Button>
              </div>
            </Modal.Content>
          </div>
        </form>
      </Modal>
    </>
  )
}
