import { Loading } from 'ui'
import React, { ReactNode } from 'react'

interface Props {
  bodyClassName?: string
  children?: ReactNode
  className?: string
  footer?: JSX.Element | false
  hideHeaderStyling?: boolean
  loading?: boolean
  noMargin?: boolean
  title?: JSX.Element | false
  wrapWithLoading?: boolean
  noHideOverflow?: boolean
}
function Panel(props: Props) {
  let headerClasses: string[] = []

  if (!props.hideHeaderStyling) {
    headerClasses = [`bg-surface-100 border-b`]
  } else {
    headerClasses = [`bg-surface-100 `]
  }

  const content = (
    <div
      className={`
        ${props.noHideOverflow ? '' : 'overflow-hidden'} 
        rounded-md 
        bg-surface-100 border shadow-sm
        ${props.noMargin ? '' : 'mb-8'} ${props.className}`}
    >
      {props.title && (
        <div className={headerClasses.join(' ')}>
          <div className="flex items-center px-6 py-4">{props.title}</div>
        </div>
      )}

      {props.children}

      {props.footer && (
        <div className="border-t bg-surface-100">
          <div className="flex h-12 items-center px-6">{props.footer}</div>
        </div>
      )}
    </div>
  )

  if (props.wrapWithLoading === false) {
    return content
  }

  return <Loading active={Boolean(props.loading)}>{content}</Loading>
}

function Content({ children, className }: { children: ReactNode; className?: string | false }) {
  let classes = ['px-6 py-4']
  if (className) classes.push(className)
  return <div className={classes.join(' ')}>{children}</div>
}

Panel.Content = Content
export default Panel
