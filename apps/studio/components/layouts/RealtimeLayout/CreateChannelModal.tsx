import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectConnectionData } from 'components/interfaces/Realtime/Policies/useProjectConnectionData'
import { useChannelCreateMutation } from 'data/realtime/channel-create-mutation'
import { Button, Input, Modal } from 'ui'

export interface CreateChannelModalProps {
  visible: boolean
  onClose: () => void
}

export const CreateChannelModal = ({ visible, onClose }: CreateChannelModalProps) => {
  const { ref } = useParams()

  const [name, setName] = useState('')
  const { endpoint, accessToken, isReady } = useProjectConnectionData(ref!)
  const { mutate: createChannel, isLoading: isCreating } = useChannelCreateMutation({
    onSuccess: (channel) => {
      toast.success(`Successfully created channel ${channel.name}`)
      onClose()
    },
  })

  const onSubmit = async (name: string) => {
    if (!ref) return console.error('Project ref is required')

    createChannel({
      projectRef: ref,
      endpoint: endpoint,
      accessToken: accessToken!,
      name: name,
    })
  }

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header="Create realtime channel"
      onCancel={() => onClose()}
    >
      <Modal.Content className="py-4">
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          className="w-full"
          layout="vertical"
          label="Name of channel"
          descriptionText="Only lowercase letters, numbers, dots, and hyphens"
        />
      </Modal.Content>
      <div className="w-full border-t border-default !mt-0" />
      <Modal.Content className="py-4">
        <div className="flex items-center space-x-2 justify-end">
          <Button type="default" htmlType="button" disabled={isCreating} onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isCreating}
            disabled={isCreating || !isReady}
            onClick={() => onSubmit(name)}
          >
            Save
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  )
}
