import { Loading } from '@supabase/ui'
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
        border border-panel-border-light dark:border-panel-border-dark
        shadow-sm overflow-hidden
        rounded-md ${props.noMargin ? '' : 'mb-8'} ${props.className}`}
    >
      {props.title && (
        <div className={headerClasses.join(' ')}>
          <div className="px-6 py-4 flex items-center">{props.title}</div>
        </div>
      )}
      <div className={`bg-panel-body-light dark:bg-panel-body-dark ${props.bodyClassName || ''}`}>
        {props.children}
      </div>

      {props.footer && (
        <div
          className="
      bg-panel-footer-light dark:bg-panel-footer-dark
      border-t border-panel-border-interior-light dark:border-panel-border-interior-dark"
        >
          <div className="px-6 h-12 flex items-center">{props.footer}</div>
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
