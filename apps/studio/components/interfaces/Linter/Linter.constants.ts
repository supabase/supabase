import { ReactNode } from 'react'

import { Lint } from '@/data/lint/lint-query'

export enum LINTER_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export type LintInfo = {
  name: string
  title: string
  icon: ReactNode
  link: (args: { projectRef: string; metadata: Lint['metadata'] }) => string
  linkText: string
  docsLink: string
  category: 'security' | 'performance' | 'health'
}
