import { useEffect, useState } from 'react'

import { decodeModel } from './model.codec'
import type { DashboardModel } from './model.schema'

type ModelState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; model: DashboardModel }
  | { status: 'error'; error: Error }

export function useModelFragment() {
  const [state, setState] = useState<ModelState>({ status: 'loading' })
  useEffect(() => {
    let current: AbortController | undefined
    const update = () => {
      current?.abort()
      const controller = new AbortController()
      current = controller
      setState({ status: 'loading' })
      void decodeModel(window.location.hash, controller.signal).then(
        (model) => {
          if (!controller.signal.aborted)
            setState(model ? { status: 'ready', model } : { status: 'empty' })
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setState({
              status: 'error',
              error: error instanceof Error ? error : new Error('Unable to open dashboard link.'),
            })
        }
      )
    }
    update()
    window.addEventListener('hashchange', update)
    return () => {
      current?.abort()
      window.removeEventListener('hashchange', update)
    }
  }, [])
  return state
}
