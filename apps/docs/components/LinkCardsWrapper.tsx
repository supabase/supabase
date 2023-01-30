import { ReactElement } from 'react'

export default function LinkCardsWrapper({ children }: { children: any }) {
  return <div className="flex w-full flex-col lg:flex-row lg:flex-wrap">{children}</div>
}
