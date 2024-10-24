import { useParams } from 'common'
import { useCreateSinkMutation } from 'data/replication/create-sink-mutation'
import { toast } from 'sonner'
import { Button, Form, Input, Modal, Select } from 'ui'

export interface CreateSinkModalProps {
  visible: boolean
  onClose: () => void
}

const CreateSinkModal = ({ visible, onClose }: CreateSinkModalProps) => {
  const { ref } = useParams()
  const { mutate: createSink, isLoading: isCreating } = useCreateSinkMutation({
    onSuccess: (res) => {
      toast.success('Successfully created sink')
      onClose()
    },
  })
  const validate = (values: any) => {
    const errors = {} as any
    if (!values.sink_name) {
      errors.sink_name = 'Please enter a name for your sink'
    }
    if (!values.project_id) {
      errors.project_id = 'Please enter a Project Id for your sink'
    }
    if (!values.dataset_id) {
      errors.dataset_id = 'Please enter a Dataset Id for your sink'
    }
    if (!values.service_account_key) {
      errors.service_account_key = 'Please enter a Service Account Key for your sink'
    }
    return errors
  }
  const onSubmit = (values: any) => {
    createSink({
      projectRef: ref!,
      sink_name: values.sink_name,
      project_id: values.project_id,
      dataset_id: values.dataset_id,
      service_account_key: values.service_account_key,
    })
  }
  const initialValues = {
    sink_type: 'BigQuery',
    sink_name: '',
    project_id: '',
    dataset_id: '',
    service_account_key: '',
  }
  return (
    <Modal
      hideFooter
      visible={visible}
      header="Create sink"
      size="xlarge"
      onCancel={() => onClose()}
    >
      <Form onSubmit={onSubmit} initialValues={initialValues} validate={validate}>
        {({ values }: { values: any }) => {
          return (
            <>
              <Modal.Content>
                <Select autoFocus id="sink_type" name="sink_type" size="small" label="Sink Type">
                  <Select.Option value="BigQuery">BigQuery</Select.Option>
                </Select>
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="sink_name"
                  name="sink_name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Sink Name"
                />
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="project_id"
                  name="project_id"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="BigQuery Project Id"
                />
              </Modal.Content>
              <Modal.Content>
                <Input
                  id="dataset_id"
                  name="dataset_id"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="BigQuery Dataset Id"
                />
              </Modal.Content>
              <Modal.Content>
                <Input.TextArea
                  id="service_account_key"
                  name="service_account_key"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="BigQuery Service Account Key"
                ></Input.TextArea>
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

export default CreateSinkModal
