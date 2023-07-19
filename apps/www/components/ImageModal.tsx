import { useEffect, useState } from 'react'

import * as Dialog from '@radix-ui/react-dialog'

import styleHandler from 'ui/src/lib/theme/styleHandler'

export type ImageModalProps = RadixProps & Props

interface RadixProps
  extends Dialog.DialogProps,
    Pick<
      Dialog.DialogContentProps,
      | 'onOpenAutoFocus'
      | 'onCloseAutoFocus'
      | 'onEscapeKeyDown'
      | 'onPointerDownOutside'
      | 'onInteractOutside'
    > {}

interface Props {
  children?: React.ReactNode
  onCancel?: any
  visible: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  className?: string
}

/**
 * Similar to ui/Modal component but with an unstyled dialog content component.
 * Mainly used to show images in a overlay.
 */
const ImageModal = ({
  children,
  onCancel = () => {},
  visible = false,
  size = 'large',
  className = '',
}: ImageModalProps) => {
  const [open, setOpen] = useState(visible ? visible : false)

  const __styles = styleHandler('modal')

  useEffect(() => {
    setOpen(visible)
  }, [visible])

  function handleOpenChange(open: boolean) {
    if (visible !== undefined && !open) {
      // controlled component behavior
      onCancel()
    } else {
      // un-controlled component behavior
      setOpen(open)
    }
  }

  const contentClasses = 'relative data-open:animate-overlay-show data-closed:animate-overlay-hide'

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={__styles.overlay} />
        <Dialog.Overlay className={__styles.scroll_overlay}>
          <Dialog.Content className={[contentClasses, __styles.size[size], className].join(' ')}>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Content({ children }: { children: React.ReactNode }) {
  const __styles = styleHandler('modal')
  return <div className={__styles.content}>{children}</div>
}

ImageModal.Content = Content
export default ImageModal
