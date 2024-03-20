import { useCreateCollection } from 'data/analytics/warehouse-collections-create-mutation'
import { useSelectedProject } from 'hooks'
import { useRouter } from 'next/router'
import React from 'react'
import toast from 'react-hot-toast'
import { Button, IconPlus, Input, Modal } from 'ui'

type Props = {}

export const CreateDataWarehouseTableModal = (props: Props) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const project = useSelectedProject()
  const { mutateAsync: createCollection, isLoading } = useCreateCollection({
    projectRef: project?.ref!,
  })

  return (
    <>
      <Button
        type="default"
        className="justify-start flex-grow w-full"
        icon={<IconPlus size="tiny" />}
        onClick={() => {
          setIsOpen(!isOpen)
        }}
      >
        New table
      </Button>
      <Modal
        size="medium"
        onCancel={() => setIsOpen(!isOpen)}
        header="Create collection"
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
                description: formData.get('description') as string,
              }
              await createCollection(values)
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
              <div className="space-y-6">
                <Input required layout="horizontal" label="Collection name" id="name" />
                <div className="text-area-text-sm">
                  <Input.TextArea
                    layout="horizontal"
                    labelOptional="Optional"
                    label="Description"
                    id="description"
                    rows={2}
                  />
                </div>
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
                  Create collection
                </Button>
              </div>
            </Modal.Content>
          </div>
        </form>
      </Modal>
    </>
  )
}
