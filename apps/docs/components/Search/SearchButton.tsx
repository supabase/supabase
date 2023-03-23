import { ButtonHTMLAttributes, DetailedHTMLProps, FC, PropsWithChildren, useRef } from 'react'
import { useCommandMenu } from '~/../../packages/ui/src/components/Command/CommandMenuProvider'

const SearchButton: FC<
  PropsWithChildren<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>
> = ({ children, ...props }) => {
  const searchButtonRef = useRef<HTMLButtonElement>()
  const { setIsOpen } = useCommandMenu()

  return (
    <button type="button" ref={searchButtonRef} onClick={() => setIsOpen(true)} {...props}>
      {children}
    </button>
  )
}

export default SearchButton
