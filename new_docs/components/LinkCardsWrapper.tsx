import { ReactElement } from 'react'

export default function LinkCardsWrapper({ children }: { children: ReactElement }) {
  return <div className="flex flex-row flex-wrap w-full">{children}</div>
}
