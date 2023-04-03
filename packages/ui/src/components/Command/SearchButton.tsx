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
  const { setIsOpen, site } = useCommandMenu()

  return (
    <button
      type="button"
      ref={searchButtonRef}
      onClick={() => setIsOpen(true)}
      {...props}
      className={
        site === 'studio'
          ? 'flex border-none rounded bg-transparent p-0 outline-none outline-offset-1 transition-all focus:outline-4 focus:outline-scale-600'
          : ''
      }
    >
      {children}
    </button>
  )
}

export default SearchButton
