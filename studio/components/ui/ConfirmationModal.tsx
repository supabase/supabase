import { Modal, Button, Space } from '@supabase/ui'
import { FC, useState, useEffect } from 'react'

interface Props {
  visible: boolean
  danger?: boolean
  title: string
  description?: string
  size?: 'small' | 'tiny' | 'medium' | 'large'
  buttonLabel: string
  buttonLoadingLabel?: string
  onSelectCancel: () => void
  onSelectConfirm: () => void
  children?: React.ReactNode
}

const ConfirmationModal: FC<Props> = ({
  visible = false,
  danger = false,
  title = '',
  description = '',
  size = 'small',
  buttonLabel = '',
  buttonLoadingLabel = '',
  onSelectCancel = () => {},
  onSelectConfirm = () => {},
  children,
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
      layout="vertical"
      visible={visible}
      title={title}
      description={description}
      size={size}
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center w-full space-x-3">
          <Button block type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button block type="primary" danger={danger} loading={loading} onClick={onConfirm}>
            {loading ? buttonLoadingLabel : buttonLabel}
          </Button>
        </div>
      }
      children={children}
    />
  )
}

export default ConfirmationModal
