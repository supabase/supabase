import { type MouseEventHandler } from 'react'
import { ButtonProps } from 'ui'

export interface CTA {
  label: string
  href: string
  type?: ButtonProps['type']
  target?: HTMLAnchorElement['target']
  onClick?: MouseEventHandler<HTMLButtonElement>
}
