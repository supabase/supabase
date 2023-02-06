import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type ClippyContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const ClippyContext = createContext<ClippyContextValue>(null)

export const useClippy = () => {
  const { isOpen, open, close } = useContext(ClippyContext)

  return { isOpen, open, close }
}

const ClippyProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
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
    <ClippyContext.Provider value={{ isOpen: isModalOpen, open: onOpen, close: onClose }}>
      {children}
    </ClippyContext.Provider>
  )
}

function useSearchKeyboardEvents({ onOpen, onClose }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          onClose()
          return
        case '/':
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

export default ClippyProvider
