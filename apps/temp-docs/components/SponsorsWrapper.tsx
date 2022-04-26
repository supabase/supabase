import { ReactElement } from 'react'
export default function SponsorsWrapper({ children }: { children: ReactElement }) {
  return <div className="flex flex-wrap w-full justify-between">{children}</div>
}
