import { PropsWithChildren, ReactNode } from 'react'
import { Loading, cn } from 'ui'

interface PanelProps {
  className?: string
  footer?: JSX.Element | false
  loading?: boolean
  noMargin?: boolean
  title?: ReactNode | false
  wrapWithLoading?: boolean
  noHideOverflow?: boolean
  titleClasses?: string
}

function Panel(props: PropsWithChildren<PanelProps>) {
  const content = (
    <div
      className={cn(
        'bg-surface-100',
        'rounded-md border shadow-sm',
        props.noHideOverflow ? '' : 'overflow-hidden',
        props.noMargin ? '' : 'mb-8',
        props.className
      )}
    >
      {props.title && (
        <div
          className={cn(
            'bg-surface-100 border-b border-default flex items-center px-6 py-4',
            props.titleClasses
          )}
        >
          {props.title}
        </div>
      )}
      {props.children}
      {props.footer && (
        <div className="bg-surface-100 border-t border-default">
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
