import dayjs from 'dayjs'
import { PropsWithChildren } from 'react'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const Main = ({ children }: PropsWithChildren<{}>) => {
  return <main className="flex max-h-screen flex-col">{children}</main>
}
