import { ReactElement } from 'react'

export default function LinkCardsWrapper({ children }: { children: ReactElement }) {
  return <div className="flex flex-col lg:flex-row lg:flex-wrap w-full">{children}</div>
}
