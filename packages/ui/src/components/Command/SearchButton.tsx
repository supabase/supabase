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
  const { setIsOpen, site, setAiVariant } = useCommandMenu()

  let aivariant: 'default' | 'support' = 'default'

  if (site === 'website') {
    aivariant = 'support'
  } else {
    aivariant = 'default'
  }

  return (
    <button
      type="button"
      ref={searchButtonRef}
      onClick={() => {
        setIsOpen(true)
        setAiVariant(aivariant)
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export default SearchButton
