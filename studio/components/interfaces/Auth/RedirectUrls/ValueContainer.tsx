import { PropsWithChildren } from 'react'

const ValueContainer = ({ children }: PropsWithChildren<{}>) => (
  <div
    className="
      bg-surface-100 border-default text-foreground flex items-center 
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
