import type React from 'react'

import { Button } from 'ui'

export type GettingStartedAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: React.ComponentProps<typeof Button>['type']
  icon?: React.ReactNode
  component?: React.ReactNode
}

export type GettingStartedStep = {
  key: string
  status: 'complete' | 'incomplete'
  icon?: React.ReactNode
  title: string
  description: string
  image?: string
  actions: GettingStartedAction[]
}

export type GettingStartedState = 'empty' | 'code' | 'no-code' | 'hidden'
