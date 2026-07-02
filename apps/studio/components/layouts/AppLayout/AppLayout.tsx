import { PropsWithChildren } from 'react'

export const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  return <div className="h-full min-h-0 basis-0 flex-1">{children}</div>
}
