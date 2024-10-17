import { useParams } from 'common'
import { useCreatePublicationMutation } from 'data/replication/create-publication-mutation'
import { useReplicationTablesQuery } from 'data/replication/tables-query'
import { toast } from 'sonner'
import { Modal, Form, Input, Checkbox, Button } from 'ui'

export interface CreatePublicationModalProps {
  visible: boolean
  sourceId: number
  onClose: () => void
}

const CreatePublicationModal = ({ visible, onClose, sourceId }: CreatePublicationModalProps) => {
  const { ref } = useParams()
  const { data: tables } = useReplicationTablesQuery({
    projectRef: ref,
    sourceId,
  })
  const { mutate: createPublication, isLoading: isCreating } = useCreatePublicationMutation({
    onSuccess: (res) => {
      toast.success('Successfully created publication')
      onClose()
    },
  })
  const validate = (values: any) => {
    const errors = {} as any
    if (!values.publication_name) {
      errors.publication_name = 'Please provide a name for your publication'
    }
    return errors
  }
  const onSubmit = (values: any) => {
    let requested_tables = []
    if (tables) {
      for (const table in tables) {
        const key = tables[table]
        const schema = values[key.schema]
        if (schema) {
          let lowercase_key = key.name.toLowerCase()
          const name = schema[lowercase_key]
          if (name) {
            if (name.length !== 0) {
              requested_tables.push({ schema: key.schema, name: key.name })
            }
          }
        }
      }
      createPublication({
        projectRef: ref!,
        sourceId,
        name: values.publication_name,
        tables: requested_tables,
      })
    }
  }
  const initialValues = {
    publication_name: '',
  }

  return (
    <Modal
      hideFooter
      visible={visible}
      header="Create publication"
      size="xlarge"
      onCancel={() => onClose()}
    >
      <Form onSubmit={onSubmit} initialValues={initialValues} validate={validate}>
        {({ values }: { values: any }) => {
          return (
            <>
              <Modal.Content>
                <Input
                  id="publication_name"
                  name="publication_name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Publication name"
                />
              </Modal.Content>
              <Modal.Content>
                <div className="text-sm text-foreground-light">Publication tables</div>
                {tables?.length === 0 ? (
                  <div className="text-sm py-5">No tables in database</div>
                ) : (
                  tables?.map((table) => {
                    let tableLabel = `${table.schema}.${table.name}`
                    let tableName = `${table.schema}/${table.name}`
                    return (
                      <div key={tableName} className="pt-5">
                        <Checkbox label={tableLabel}></Checkbox>
                      </div>
                    )
                  })
                )}
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content className="flex items-center space-x-2 justify-end">
                <Button
                  type="default"
                  htmlType="button"
                  disabled={isCreating}
                  onClick={() => onClose()}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isCreating} disabled={isCreating}>
                  Create
                </Button>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default CreatePublicationModal
