import { PropsWithChildren } from 'react'

interface ValueContainerProps {
  isSelected?: boolean
  onClick?: () => void
}

const ValueContainer = ({
  children,
  isSelected = false,
  onClick,
}: PropsWithChildren<ValueContainerProps>) => (
  <div
    className={`
      bg-surface-100 border-default text-foreground flex items-center 
      justify-between gap-2
      border px-6 
      py-4 text-sm
      first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl
      ${isSelected ? 'bg-surface-300' : ''}
      ${onClick ? 'cursor-pointer' : ''}
    `}
    onClick={onClick}
  >
    {children}
  </div>
)

export default ValueContainer
