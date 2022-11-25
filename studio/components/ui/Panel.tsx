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
}
function Panel(props: Props) {
  let headerClasses: string[] = []

  if (!props.hideHeaderStyling) {
    headerClasses = [
      `
    bg-panel-header-light dark:bg-panel-header-dark
    border-b border-panel-border-light dark:border-panel-border-dark`,
    ]
  } else {
    headerClasses = [
      `
    bg-panel-body-light dark:bg-panel-body-dark`,
    ]
  }

  const content = (
    <div
      className={`
        overflow-hidden rounded-md border
        border-panel-border-light shadow-sm
        dark:border-panel-border-dark ${props.noMargin ? '' : 'mb-8'} ${props.className}`}
    >
      {props.title && (
        <div className={headerClasses.join(' ')}>
          <div className="flex items-center px-6 py-4">{props.title}</div>
        </div>
      )}
      <div className={`bg-panel-body-light dark:bg-panel-body-dark ${props.bodyClassName || ''}`}>
        {props.children}
      </div>

      {props.footer && (
        <div
          className="
      border-t border-panel-border-interior-light
      bg-panel-footer-light dark:border-panel-border-interior-dark dark:bg-panel-footer-dark"
        >
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
