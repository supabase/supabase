import { Lint } from 'data/lint/lint-query'
export enum LINTER_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

export type LintInfo = {
  name: string
  title: string
  icon: JSX.Element
  link: (args: { projectRef: string; metadata: Lint['metadata'] }) => string
  linkText: string
  docsLink: string
}

export const LINT_TABS = [
  {
    id: LINTER_LEVELS.ERROR,
    label: 'Errors',
    description: 'You should consider these issues urgent and fix them as soon as you can.',
    descriptionShort: 'Require immediate attention',
  },
  {
    id: LINTER_LEVELS.WARN,
    label: 'Warnings',
    description: 'You should try and read through these issues and fix them if necessary.',
    descriptionShort: 'To resolve only if necessary',
  },
  {
    id: LINTER_LEVELS.INFO,
    label: 'Info',
    description: 'You should read through these suggestions and consider implementing them.',
    descriptionShort: 'For consideration to implement',
  },
]
