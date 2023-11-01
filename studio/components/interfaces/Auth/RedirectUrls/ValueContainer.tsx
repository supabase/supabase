import { PropsWithChildren } from 'react'

const ValueContainer = ({ children }: PropsWithChildren<{}>) => (
  <div
    className="
      bg-scale-100 dark:bg-scale-300 border-scale-500 text-foreground flex items-center 
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
