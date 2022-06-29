import { Modal, Button, Form } from '@supabase/ui'
import { useState, useEffect } from 'react'

// [Joshen] As of 280222, let's just use THIS component as the one and only confirmation modal
// deprecate all others, since it uses the Form component from the UI library as well

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
}) => {
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
          let errors = []
          return errors
        }}
      >
        {() => {
          return (
            <div className="py-4 space-y-4">
              <Modal.Content>
                <p className="text-sm text-scale-1100">{description}</p>
              </Modal.Content>
              <Modal.Seperator />
              <Modal.Content>
                <div className="flex items-center gap-2">
                  <Button htmlType="button" type="default" onClick={onSelectCancel} block>
                    Cancel
                  </Button>
                  <Button
                    htmlType="submit"
                    block
                    type={danger ? 'danger' : 'primary'}
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
