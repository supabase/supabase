import { useTheme } from 'common/Providers'
import Image from 'next/image'
import { FC, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clippyImageDark from '../../public/img/clippy-dark.png'
import clippyImage from '../../public/img/clippy.png'
import ClippyBubble from './ClippyBubble'
import ClippyModal from './ClippyModal'

const Clippy: FC = () => {
  const { isDarkMode } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const onOpen = useCallback(() => {
    setIsModalOpen(true)
    document.body.classList.add('DocSearch--active')
  }, [])

  const onClose = useCallback(() => {
    setIsModalOpen(false)
    document.body.classList.remove('DocSearch--active')
  }, [])

  useSearchKeyboardEvents({
    onOpen,
    onClose,
  })

  return (
    <>
      {!isModalOpen && (
        <div className="flex flex-col items-end gap-4">
          <ClippyBubble onClick={onOpen} />
          <div className="w-[150px]">
            <Image src={isDarkMode ? clippyImageDark : clippyImage} alt="Clippy" />
          </div>
        </div>
      )}
      {isModalOpen && createPortal(<ClippyModal onClose={onClose} />, document.body)}
    </>
  )
}

export default Clippy

function useSearchKeyboardEvents({ onOpen, onClose }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          onClose()
          return
        case 'j':
          if (event.metaKey || event.ctrlKey) {
            onOpen()
          }
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onOpen, onClose])
}
