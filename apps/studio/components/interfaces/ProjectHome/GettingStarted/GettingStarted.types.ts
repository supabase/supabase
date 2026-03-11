import { ComponentProps, ReactNode } from 'react'

import { Button } from 'ui'

export type GettingStartedAction = {
  label: string
  href?: string
  variant?: ComponentProps<typeof Button>['type']
  icon?: ReactNode
  component?: ReactNode
  onClick?: () => void
}

export type GettingStartedStep = {
  key: string
  status: 'complete' | 'incomplete'
  icon?: ReactNode
  title: string
  description: string
  image?: string
  actions: GettingStartedAction[]
}

export type GettingStartedState = 'empty' | 'code' | 'no-code' | 'hidden'
