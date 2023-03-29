import * as React from 'react'
import { ButtonHTMLAttributes, DetailedHTMLProps, PropsWithChildren, useRef } from 'react'
import { useCommandMenu } from './CommandMenuProvider'

const SearchButton = ({
  children,
  ...props
}: PropsWithChildren<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>) => {
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const { setIsOpen } = useCommandMenu()

  return (
    <button type="button" ref={searchButtonRef} onClick={() => setIsOpen(true)} {...props}>
      {children}
    </button>
  )
}

export default SearchButton
