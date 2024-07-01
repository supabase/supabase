import { lazy } from 'react'

export default function dynamic(fn: () => any) {
  return lazy(fn)
}
