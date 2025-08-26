'use client'

import { cn } from 'ui'
import { memo } from 'react'
import dynamic from 'next/dynamic'

// Avoid importing streamdown on the server to prevent CSS import errors (e.g. katex CSS)
const Streamdown = dynamic(() => import('streamdown').then((m) => m.Streamdown), {
  ssr: false,
})

type ResponseProps = {
  className?: string
  children?: string | null
  // Allow pass-through of any additional props supported by Streamdown
  [key: string]: any
}

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn('[&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

Response.displayName = 'Response'
