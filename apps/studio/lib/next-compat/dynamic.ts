import { lazy } from 'react'

export default function dynamic(fn: () => any) {
  return lazy(() =>
    fn().then((mod: any) => {
      if (!mod.default) {
        return {
          default: mod,
        }
      }

      return mod
    })
  )
}
