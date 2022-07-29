import { FC, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const ValueContainer: FC<Props> = ({ children }) => (
  <div
    className="
      bg-scale-100 dark:bg-scale-300 border-scale-500 text-scale-1200 flex items-center 
      justify-between gap-2
      border px-6 
      py-4 text-sm
      first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl
    "
  >
    {children}
  </div>
)

export default ValueContainer
