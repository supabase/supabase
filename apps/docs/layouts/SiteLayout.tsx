import { PropsWithChildren } from 'react'

const SiteLayout = ({ children }: PropsWithChildren<{}>) => {
  return <main className="grow overflow-hidden">{children}</main>
}

export default SiteLayout
