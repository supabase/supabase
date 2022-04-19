import { Loading } from '@supabase/ui'
import React from 'react'

function Panel(props: any) {
  let headerClasses = []

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

  return <Loading active={props.loading}>{content}</Loading>
}

function Content(props: any) {
  let classes = ['px-6 py-4']
  if (props.className) classes.push(props.className)
  return <div className={classes.join(' ')}>{props.children}</div>
}

Panel.Content = Content
export default Panel
