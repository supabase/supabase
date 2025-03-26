'use client'

import { useEffect } from 'react'

export function BaseInjector() {
  useEffect(() => {
    // Remove any existing base tag
    const existingBase = document.querySelector('base')
    if (existingBase) existingBase.remove()

    // Add new base tag
    const base = document.createElement('base')
    base.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/example/password-based-auth/`
    document.head.prepend(base)

    return () => {
      base.remove()
    }
  }, [])

  return null
}
