import { type PropsWithChildren } from 'react'

import { useCommandPagesContext } from '../internal/Context'

const PageSwitch = ({ children }: PropsWithChildren) => {
  const { commandPages, pageStack } = useCommandPagesContext()
  const currentPage = pageStack.at(-1)

  if (currentPage && currentPage in commandPages) {
    const Component = commandPages[currentPage]
    return <Component />
  }

  return <>{children}</>
}

const CommandMenu = ({ children }: PropsWithChildren) => <PageSwitch>{children}</PageSwitch>

export { CommandMenu }
