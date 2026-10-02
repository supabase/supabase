import { cva } from 'class-variance-authority'
import { Dialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

export type ImageModalProps = RadixProps & Props

interface RadixProps
  extends
    Dialog.DialogProps,
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

const dialogContentVariants = cva(
  cn('relative data-open:animate-overlay-show data-closed:animate-overlay-hide'),
  {
    variants: {
      size: {
        tiny: `sm:align-middle sm:w-full sm:max-w-xs`,
        small: `sm:align-middle sm:w-full sm:max-w-sm`,
        medium: `sm:align-middle sm:w-full sm:max-w-lg`,
        large: `sm:align-middle sm:w-full md:max-w-xl`,
        xlarge: `sm:align-middle sm:w-full md:max-w-3xl`,
        xxlarge: `sm:align-middle sm:w-full max-w-screen md:max-w-6xl`,
        xxxlarge: `sm:align-middle sm:w-full md:max-w-7xl`,
      },
    },
  }
)

const overlayClasses =
  'z-40 fixed bg-alternative h-full w-full left-0 top-0 opacity-75 data-closed:animate-fade-out-overlay-bg data-open:animate-fade-in-overlay-bg'
const scrollOverlayClasses =
  'z-40 fixed inset-0 grid place-items-center overflow-y-auto data-open:animate-overlay-show data-closed:animate-overlay-hide'

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

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClasses} />
        <Dialog.Overlay className={scrollOverlayClasses}>
          <Dialog.Content className={dialogContentVariants({ size, className })}>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Content({ children }: { children: React.ReactNode }) {
  return <div className="px-5">{children}</div>
}

ImageModal.Content = Content
export default ImageModal
