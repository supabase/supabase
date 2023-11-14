import { PropsWithChildren, ReactNode } from 'react'
import { Loading } from 'ui'

interface PanelProps {
  bodyClassName?: string
  className?: string
  footer?: JSX.Element | false
  hideHeaderStyling?: boolean
  loading?: boolean
  noMargin?: boolean
  title?: JSX.Element | false
  wrapWithLoading?: boolean
  noHideOverflow?: boolean
}
function Panel(props: PropsWithChildren<PanelProps>) {
  let headerClasses: string[] = []

  if (!props.hideHeaderStyling) {
    headerClasses = [`bg-surface-100 border-b border-overlay`]
  } else {
    headerClasses = [`bg-surface-100`]
  }

  const content = (
    <div
      className={`
        ${props.noHideOverflow ? '' : 'overflow-hidden'} rounded-md border
        border-overlay shadow-sm ${props.noMargin ? '' : 'mb-8'} ${props.className}`}
    >
      {props.title && (
        <div className={headerClasses.join(' ')}>
          <div className="flex items-center px-6 py-4">{props.title}</div>
        </div>
      )}
      <div className={`bg-surface-100 ${props.bodyClassName || ''}`}>{props.children}</div>

      {props.footer && (
        <div className="bg-surface-100 border-t border-overlay">
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
