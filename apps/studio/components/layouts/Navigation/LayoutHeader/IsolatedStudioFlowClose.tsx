import { X } from 'lucide-react'
import { createContext, use, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Button } from 'ui'

import { useLatest } from '@/hooks/misc/useLatest'

type IsolatedStudioFlowCloseContextValue = {
  register: (onClose: () => void) => () => void
  close: () => void
}

const IsolatedStudioFlowCloseContext = createContext<IsolatedStudioFlowCloseContextValue | null>(
  null
)

export function IsolatedStudioFlowCloseProvider({
  children,
  fallbackClose,
}: {
  children: ReactNode
  fallbackClose?: () => void
}) {
  const handlerRef = useRef<(() => void) | null>(null)
  const fallbackRef = useLatest(fallbackClose)

  const register = useCallback((onClose: () => void) => {
    handlerRef.current = onClose
    return () => {
      if (handlerRef.current === onClose) handlerRef.current = null
    }
  }, [])

  const close = useCallback(() => {
    const handler = handlerRef.current ?? fallbackRef.current
    handler?.()
  }, [fallbackRef])

  return (
    <IsolatedStudioFlowCloseContext.Provider value={{ register, close }}>
      {children}
    </IsolatedStudioFlowCloseContext.Provider>
  )
}

export function useRegisterIsolatedStudioFlowClose(onClose: () => void) {
  const context = use(IsolatedStudioFlowCloseContext)

  useEffect(() => {
    if (!context) return
    return context.register(onClose)
  }, [context, onClose])
}

export function IsolatedStudioFlowExit({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  useRegisterIsolatedStudioFlowClose(onClose)
  return children
}

export function IsolatedStudioFlowCloseButton() {
  const context = use(IsolatedStudioFlowCloseContext)
  if (!context) return null

  return (
    <Button
      type="button"
      variant="text"
      icon={<X size={16} />}
      className="px-1"
      aria-label="Close"
      onClick={context.close}
    />
  )
}
