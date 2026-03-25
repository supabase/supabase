import { useCallback, useMemo, useState } from 'react'
import useLatest from '../misc/useLatest'

export interface ConfirmOnCloseModalProps {
  visible: boolean
  onClose: () => void
  onCancel: () => void
}

interface UseConfirmOnCloseProps {
  checkIsDirty: () => boolean
  onClose: () => void
}

export const useConfirmOnClose = ({ checkIsDirty, onClose }: UseConfirmOnCloseProps) => {
  const [visible, setVisible] = useState(false)

  const checkIsDirtyRef = useLatest(checkIsDirty)
  const onCloseRef = useLatest(onClose)

  const confirmOnClose = useCallback(() => {
    if (checkIsDirtyRef.current()) {
      setVisible(true)
    } else {
      onCloseRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        confirmOnClose()
      }
    },
    [confirmOnClose]
  )

  const onConfirm = useCallback(() => {
    setVisible(false)
    onCloseRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCancel = useCallback(() => {
    setVisible(false)
  }, [])

  const modalProps: ConfirmOnCloseModalProps = useMemo(
    () => ({
      visible,
      onClose: onConfirm,
      onCancel,
    }),
    [visible, onConfirm, onCancel]
  )

  return useMemo(
    () => ({
      confirmOnClose,
      handleOpenChange,
      modalProps,
    }),
    [confirmOnClose, handleOpenChange, modalProps]
  )
}
