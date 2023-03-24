import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  PropsWithChildren,
  useEffect,
  useRef,
} from 'react'
import { useActionKey } from '~/hooks/useActionKey'
import { useSearch } from './SearchProvider'

const SearchButton: FC<
  PropsWithChildren<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>
> = ({ children, ...props }) => {
  const searchButtonRef = useRef<HTMLButtonElement>()
  const { open, setQuery } = useSearch()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (searchButtonRef.current === document.activeElement) {
        if (/[a-zA-Z0-9]/.test(String.fromCharCode(event.keyCode))) {
          open()
          setQuery?.(event.key)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setQuery])

  return (
    <button type="button" ref={searchButtonRef} onClick={open} {...props}>
      {children}
    </button>
  )
}

export default SearchButton
