import { type ReactNode, useEffect, useRef, useCallback } from 'react'

import { useCommandPagesContext } from '../internal/Context'

const useCommandPages = () => {
  const ctx = useCommandPagesContext()
  return {
    commandPages: ctx.commandPages,
    pageStack: ctx.pageStack,
  }
}

const useOnce = <Args extends Array<unknown>, Return>(
  cb: (...args: Args) => Return,
  ...args: Args
) => {
  const alreadyRun = useRef(false)
  const result = useRef<Return>()

  if (!alreadyRun.current) {
    result.current = cb(...args)
    alreadyRun.current = true
  }

  return result.current
}

const useCleanup = (cb: (() => void) | undefined) => {
  useEffect(() => cb, [cb])
}

const useAddCommandPage = (name: string, component: () => ReactNode) => {
  const { addCommandPage } = useCommandPagesContext()
  const registerPage = useCallback(() => addCommandPage(name, component), [addCommandPage])

  const cleanup = useOnce(registerPage)
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
