import { useTheme } from 'common/Providers'
import Image from 'next/image'
import { FC } from 'react'
import { createPortal } from 'react-dom'
import clippyImageDark from '../../public/img/clippy-dark.png'
import clippyImage from '../../public/img/clippy.png'
import ClippyBubble from './ClippyBubble'
import ClippyModal from './ClippyModal'
import { useClippy } from './ClippyProvider'
import { useFlag } from '~/hooks/useFlag'
const Clippy: FC = () => {
  const { isDarkMode } = useTheme()
  const { isOpen, open, close } = useClippy()
  const enableClippy = useFlag('enableClippy')

  return (
    <>
      {!isOpen && (
        <div className="hidden md:flex flex-col items-end gap-1 md:gap-4">
          {enableClippy && (
            <>
              <ClippyBubble onClick={open} />
              <div className="w-[80px] lg:w-[120px] p-8 md:p-0">
                <Image src={isDarkMode ? clippyImageDark : clippyImage} alt="Clippy" />
              </div>
            </>
          )}
        </div>
      )}
      {isOpen && createPortal(<ClippyModal onClose={close} />, document.body)}
    </>
  )
}

export default Clippy
