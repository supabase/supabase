import { useParams } from 'common'
import { useCreatePipelineMutation } from 'data/replication/create-pipeline-mutation'
import { toast } from 'sonner'
import { Button, Form, Input, Modal } from 'ui'

export interface CreatePipelineModalProps {
  visible: boolean
  onClose: () => void
}

const CreatePipelineModal = ({ visible, onClose }: CreatePipelineModalProps) => {
  const { ref } = useParams()
  const { mutate: createPipeline, isLoading: isCreating } = useCreatePipelineMutation({
    onSuccess: (res) => {
      toast.success('Successfully created pipeline')
      onClose()
    },
  })

  const validate = (values: any) => {
    const errors = {} as any
    if (!values.source_id) {
      errors.source_id = 'Please enter a Source Id for your sink'
    }
    if (!values.sink_id) {
      errors.sink_id = 'Please enter a Sink Id for your sink'
    }
    if (!values.publication_name) {
      errors.publication_name = 'Please enter a Publication Name for your sink'
    }
    if (!values.max_size) {
      errors.max_size = 'Please enter a Max Size for your sink'
    }
    if (!values.max_fill_secs) {
      errors.max_size = 'Please enter a Max Fill Seconds for your sink'
    }
    return errors
  }

  const onSubmit = (values: any) => {
    createPipeline({
      projectRef: ref!,
      source_id: Number(values.source_id),
      sink_id: Number(values.sink_id),
      publication_name: values.publication_name,
      config: {
        config: { max_size: Number(values.max_size), max_fill_secs: Number(values.max_fill_secs) },
      },
    })
  }

  const initialValues = {
    source_id: '',
    sink_id: '',
    publication_name: '',
    max_size: 10000,
    max_fill_secs: 10,
  }
  return (
    <Modal
      hideFooter
      visible={visible}
      header="Create pipeline"
      size="xlarge"
      onCancel={() => onClose()}
    >
      <Form onSubmit={onSubmit} initialValues={initialValues} validate={validate}>
        {({ values }: { values: any }) => {
          return (
            <>
              <Modal.Content>
                <Input
                  id="source_id"
                  name="source_id"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Source Id"
                />
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="sink_id"
                  name="sink_id"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Sink Id"
                />
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="publication_name"
                  name="publication_name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Publication Name"
                ></Input>
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="max_size"
                  name="max_size"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Max Size"
                ></Input>
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="max_fill_secs"
                  name="max_fill_secs"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Max Fill Secs"
                ></Input>
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

export default CreatePipelineModal
