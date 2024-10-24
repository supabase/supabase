import { useParams } from 'common'
import { useCreatePipelineMutation } from 'data/replication/create-pipeline-mutation'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useReplicationSinksQuery } from 'data/replication/sinks-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { toast } from 'sonner'
import { Button, Form, Input, Modal, Select } from 'ui'

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
  const { data } = useReplicationSourcesQuery({
    projectRef: ref,
  })

  let thisProjectSource = data?.find((s) => s.name === ref)

  if (!thisProjectSource) {
    toast.error("Failed to find this project's source")
  }

  const { data: sinks_data } = useReplicationSinksQuery({
    projectRef: ref,
  })
  const sinks = sinks_data ?? []

  const { data: pub_data } = useReplicationPublicationsQuery({
    projectRef: ref,
    sourceId: thisProjectSource!.id,
  })

  const publications = pub_data ?? []

  const validate = (values: any) => {
    const errors = {} as any
    if (!values.sink_id) {
      errors.sink_id = 'Please select a sink for your pipeline'
    }
    if (!values.publication_name) {
      errors.publication_name = 'Please select a publication for your pipeline'
    }
    if (!values.max_size) {
      errors.max_size = 'Please enter a Max Size for your pipeline'
    }
    if (!values.max_fill_secs) {
      errors.max_size = 'Please enter a Max Fill Seconds for your pipeline'
    }
    return errors
  }

  const onSubmit = (values: any) => {
    createPipeline({
      projectRef: ref!,
      source_id: Number(thisProjectSource!.id),
      sink_id: Number(values.sink_id),
      publication_name: values.publication_name,
      config: {
        config: { max_size: Number(values.max_size), max_fill_secs: Number(values.max_fill_secs) },
      },
    })
  }

  const first_sink_id = sinks.length > 0 ? sinks[0].id : ''
  const first_publication_name = publications.length > 0 ? publications[0].name : ''
  const initialValues = {
    sink_id: first_sink_id,
    publication_name: first_publication_name,
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
                <Select
                  autoFocus
                  id="sink_id"
                  name="sink_id"
                  size="small"
                  label="Sink"
                  onChange={(e) => {
                    values.sink_id = e.target.value
                  }}
                >
                  {sinks.map((sink) => (
                    <Select.Option key={sink.id} value={String(sink.id)}>
                      {sink.name}
                    </Select.Option>
                  ))}
                </Select>
              </Modal.Content>
              <Modal.Content>
                <Select
                  autoFocus
                  id="publication_name"
                  name="publication_name"
                  size="small"
                  label="Publication"
                  onChange={(e) => {
                    values.publication_name = e.target.value
                  }}
                >
                  {publications.map((pub) => (
                    <Select.Option key={pub.name} value={pub.name}>
                      {pub.name}
                    </Select.Option>
                  ))}
                </Select>
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
