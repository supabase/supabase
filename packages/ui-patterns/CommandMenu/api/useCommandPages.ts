import { type ReactNode, useCallback } from 'react'

import { useCleanup, useRunOnce } from 'common'

import { useCommandPagesContext } from '../internal/Context'

const useCommandPages = () => {
  const ctx = useCommandPagesContext()
  return {
    commandPages: ctx.commandPages,
    pageStack: ctx.pageStack,
  }
}

const useAddCommandPage = (name: string, component: () => ReactNode) => {
  const { addCommandPage } = useCommandPagesContext()
  const registerPage = useCallback(() => addCommandPage(name, component), [addCommandPage])

  const cleanup = useRunOnce(registerPage)
  useCleanup(cleanup)
}

const useSetCommandPage = () => {
  const { appendPageStack, commandPages } = useCommandPagesContext()

  const setCommandPage = useCallback(
    (name: string) => {
      if (name in commandPages) {
        appendPageStack(name)
      }
    },
    [appendPageStack, commandPages]
  )

  return setCommandPage
}

export { useAddCommandPage, useCommandPages, useSetCommandPage }
