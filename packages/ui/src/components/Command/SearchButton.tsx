import { ButtonHTMLAttributes, DetailedHTMLProps, PropsWithChildren, useRef } from 'react'
import { useCommandMenu } from './CommandMenuProvider'

const SearchButton = ({
  children,
  className,
  ...props
}: PropsWithChildren<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>) => {
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const { setIsOpen, site } = useCommandMenu()

  return (
    <button
      type="button"
      ref={searchButtonRef}
      onClick={() => setIsOpen(true)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export default SearchButton
