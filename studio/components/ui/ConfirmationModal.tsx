import { Modal, Button, Space } from 'ui'
import { MouseEventHandler } from 'react'
import { FC, useState, useEffect } from 'react'

interface Props {
  visible: boolean
  danger?: boolean
  header: string | JSX.Element
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
  header = '',
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

  const onConfirm: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    onSelectConfirm()
  }

  return (
    <Modal
      layout="vertical"
      visible={visible}
      header={header}
      description={description}
      size={size}
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex justify-end w-full items-center space-x-3">
          <Button type="default" disabled={loading} onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button
            type={danger ? 'danger' : 'primary'}
            loading={loading}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? buttonLoadingLabel : buttonLabel}
          </Button>
        </div>
      }
      children={children}
    />
  )
}

export default ConfirmationModal
