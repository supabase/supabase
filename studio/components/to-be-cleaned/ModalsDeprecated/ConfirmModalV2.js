import { Modal, Button, Space } from '@supabase/ui'
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
    <Modal
      visible={visible}
      title={title}
      description={description}
      size={size}
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" danger={danger} loading={loading} onClick={onConfirm}>
            {loading ? buttonLoadingLabel : buttonLabel}
          </Button>
        </Space>
      }
    />
  )
}

export default ConfirmModal
