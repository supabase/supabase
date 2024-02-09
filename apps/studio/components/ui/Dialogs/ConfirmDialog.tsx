import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'ui'

// [Joshen] As of 280222, let's just use ConfirmationModal as the one and only confirmation modal (Deprecate this)

interface ConfirmModalProps {
  visible: boolean
  danger?: boolean
  title: string
  description: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  buttonLabel: string
  buttonLoadingLabel?: string
  onSelectCancel: () => void
  onSelectConfirm: () => void
}

const ConfirmModal = ({
  visible = false,
  danger = false,
  title = '',
  description = '',
  size = 'small',
  buttonLabel = '',
  buttonLoadingLabel = '',
  onSelectCancel = () => {},
  onSelectConfirm = () => {},
}: ConfirmModalProps) => {
  useEffect(() => {
    if (visible) {
      setLoading(false)
    }
  }, [visible])

  const [loading, setLoading] = useState(false)

  const onConfirm = () => {
    setLoading(true)
    onSelectConfirm()
  }

  return (
    <Modal
      header={title}
      visible={visible}
      title={title}
      description={description}
      size={size}
      hideFooter
      onCancel={onSelectCancel}
    >
      <Form
        initialValues={{}}
        validateOnBlur
        onSubmit={() => onConfirm()}
        validate={() => {
          return []
        }}
      >
        {() => {
          return (
            <div className="space-y-4 py-4">
              <Modal.Content>
                <p className="text-sm text-foreground-light">{description}</p>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="flex items-center gap-2">
                  <Button
                    block
                    htmlType="button"
                    type="default"
                    onClick={onSelectCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    htmlType="submit"
                    block
                    type={danger ? 'danger' : 'primary'}
                    disabled={loading}
                    loading={loading}
                  >
                    {buttonLoadingLabel && loading
                      ? buttonLoadingLabel
                      : buttonLabel
                        ? buttonLabel
                        : 'Confirm'}
                  </Button>
                </div>
              </Modal.Content>
            </div>
          )
        }}
      </Form>
    </Modal>
  )
}

export default ConfirmModal
