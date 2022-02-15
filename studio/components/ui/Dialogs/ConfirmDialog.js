import { Modal, Button, Form } from '@supabase/ui'
import { useState, useEffect } from 'react'

// [Joshen] I feel like having the confirm modal as a component to import is better than firing
// the confirmAlert helper function? We'd have the modal transitions too

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
    <Modal visible={visible} title={title} description={description} size={size}>
      <Form onSubmit={() => console.log('submitting confirm dialog')}>
        <p>Hello</p>
        <Button htmlType="submit">Confirm</Button>
      </Form>
    </Modal>
  )
}

export default ConfirmModal
