import { ReactElement } from 'react'
export default function SponsorsWrapper({ children }: { children: ReactElement }) {
  return <div className="flex w-full flex-wrap justify-between">{children}</div>
}
