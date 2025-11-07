import { useCallback, useState, type ReactNode } from 'react'

export type ConfirmOnCloseModalProps = {
  visible: boolean
  onClose: () => void
  onCancel: () => void
}

type UseConfirmOnCloseBaseParams = {
  checkIsDirty: () => boolean
  onClose: () => void
}

type UseConfirmOnCloseParams<ExtraProps extends Record<string, unknown> | undefined = undefined> =
  UseConfirmOnCloseBaseParams &
    (ExtraProps extends undefined
      ? {
          ConfirmationModal: (props: ConfirmOnCloseModalProps) => ReactNode
        }
      : {
          ConfirmationModal: (props: ConfirmOnCloseModalProps & ExtraProps) => ReactNode
          extraProps: ExtraProps
        })

type ConfirmOnCloseReturn = {
  confirmOnClose: () => void
  modal: ReactNode
}

export const useConfirmOnClose = <
  ExtraProps extends Record<string, unknown> | undefined = undefined,
>(
  props: UseConfirmOnCloseParams<ExtraProps>
): ConfirmOnCloseReturn => {
  const { checkIsDirty, onClose, ConfirmationModal } = props

  const [visible, setVisible] = useState(false)

  const confirmOnClose = useCallback(() => {
    if (checkIsDirty()) {
      setVisible(true)
    } else {
      onClose()
    }
  }, [checkIsDirty, onClose])

  const onConfirm = () => {
    setVisible(false)
    onClose()
  }

  const baseModalProps: ConfirmOnCloseModalProps = {
    visible,
    onClose: onConfirm,
    onCancel: () => setVisible(false),
  }

  const modal =
    'extraProps' in props ? (
      <ConfirmationModal {...baseModalProps} {...props.extraProps} />
    ) : (
      <ConfirmationModal {...baseModalProps} />
    )

  return {
    confirmOnClose,
    modal,
  }
}
