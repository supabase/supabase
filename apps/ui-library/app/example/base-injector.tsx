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

    // Add preview class to body to use shadcn theme vars
    const bodyElement = document.querySelector('body')
    if (bodyElement) {
      bodyElement.classList.add('preview')
    }

    return () => {
      base.remove()
    }
  }, [])

  return null
}
