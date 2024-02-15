import { PropsWithChildren, ReactNode } from 'react'
import { Loading, cn } from 'ui'

interface PanelProps {
  bodyClassName?: string
  className?: string
  footer?: JSX.Element | false
  hideHeaderStyling?: boolean
  loading?: boolean
  noMargin?: boolean
  title?: ReactNode | false
  wrapWithLoading?: boolean
  noHideOverflow?: boolean
  headerClasses?: string
}

function Panel(props: PropsWithChildren<PanelProps>) {
  const content = (
    <div
      className={cn(
        'rounded-md border border-overlay shadow-sm',
        props.noHideOverflow ? '' : 'overflow-hidden',
        props.noMargin ? '' : 'mb-8',
        props.className
      )}
    >
      {props.title && (
        <div
          className={cn(
            props.hideHeaderStyling ? 'bg-surface-100 border-b border-overlay' : 'bg-surface-100',
            props.headerClasses
          )}
        >
          <div className="flex items-center px-6 py-4">{props.title}</div>
        </div>
      )}
      <div className={cn('bg-surface-100', props.bodyClassName)}>{props.children}</div>

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
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

Panel.Content = Content
export default Panel
