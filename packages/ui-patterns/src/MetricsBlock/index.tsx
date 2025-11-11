'use client'

import * as React from 'react'
import { Card, cn } from 'ui'
import Link from 'next/link'
import { useContext } from 'react'

interface MetricsBlockContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsBlockContext = React.createContext<MetricsBlockContextValue>({
  isLoading: false,
  isDisabled: false,
})

const useMetricsBlock = () => {
  return useContext(MetricsBlockContext)
}

type MetricsBlockElement = 'card' | 'link' | 'button'

type PolymorphicProps<T extends MetricsBlockElement> = {
  as?: T
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
  children: React.ReactNode
} & (T extends 'link'
  ? { href: string } & Omit<React.ComponentProps<typeof Link>, 'as' | 'href'>
  : T extends 'button'
    ? React.ButtonHTMLAttributes<HTMLButtonElement>
    : React.HTMLAttributes<HTMLDivElement>)

type MetricsBlockProps =
  | PolymorphicProps<'card'>
  | PolymorphicProps<'link'>
  | PolymorphicProps<'button'>

const MetricsBlock = React.forwardRef<HTMLElement, MetricsBlockProps>(
  ({ as = 'card', isLoading = false, isDisabled = false, className, children, ...props }, ref) => {
    const content = (
      <MetricsBlockContext.Provider value={{ isLoading, isDisabled }}>
        {children}
      </MetricsBlockContext.Provider>
    )

    if (as === 'link') {
      const { href, ...linkProps } = props as PolymorphicProps<'link'>
      return (
        <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...linkProps}>
          {content}
        </Link>
      )
    }

    if (as === 'button') {
      const buttonProps = props as PolymorphicProps<'button'>
      return (
        <button ref={ref as React.Ref<HTMLButtonElement>} {...buttonProps}>
          {content}
        </button>
      )
    }

    const cardProps = props as React.HTMLAttributes<HTMLDivElement>
    return (
      <Card ref={ref as React.Ref<HTMLDivElement>} className={cn(className)} {...cardProps}>
        {content}
      </Card>
    )
  }
)

MetricsBlock.displayName = 'MetricsBlock'

export { MetricsBlock, useMetricsBlock }
