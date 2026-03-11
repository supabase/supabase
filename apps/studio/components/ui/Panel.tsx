import { Megaphone } from 'lucide-react'
import { forwardRef, PropsWithChildren, ReactNode } from 'react'
import { Badge, Button, cn, Loading } from 'ui'

interface PanelProps {
  className?: string
  id?: string
  footer?: JSX.Element | false
  loading?: boolean
  noMargin?: boolean
  title?: ReactNode | false
  wrapWithLoading?: boolean
  noHideOverflow?: boolean
  titleClasses?: string
  footerClasses?: string
}

/**
 * @deprecated Use Card component from ui package instead
 */
function Panel(props: PropsWithChildren<PanelProps>) {
  const content = (
    <div
      className={cn(
        'bg-surface-100',
        'rounded-md border shadow-sm',
        props.noHideOverflow ? '' : 'overflow-hidden',
        props.noMargin ? '' : 'mb-4 md:mb-8',
        props.className
      )}
      id={props.id}
    >
      {props.title && (
        <div
          className={cn(
            'bg-surface-100 border-b border-default flex items-center px-card py-4',
            props.titleClasses
          )}
        >
          {props.title}
        </div>
      )}
      {props.children}
      {props.footer && <Footer className={props.footerClasses}>{props.footer}</Footer>}
    </div>
  )

  if (props.wrapWithLoading === false) {
    return content
  }

  return <Loading active={Boolean(props.loading)}>{content}</Loading>
}

function Content({ children, className }: { children: ReactNode; className?: string | false }) {
  return <div className={cn('px-card py-4', className)}>{children}</div>
}

function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface-100 border-t border-default', className)}>
      <div className="flex h-12 items-center px-card">{children}</div>
    </div>
  )
}

const PanelNotice = forwardRef<
  HTMLDivElement,
  {
    className?: string | false
    title?: string
    description?: ReactNode
    href?: string
    buttonText?: string
    layout?: 'horizontal' | 'vertical'
    badgeLabel?: string
  }
>(
  (
    {
      className,
      title,
      description,
      href,
      buttonText,
      layout = 'horizontal',
      badgeLabel,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'relative px-card py-5 bg-studio flex flex-col lg:flex-row lg:justify-between gap-6 overflow-hidden lg:items-center',
          layout === 'vertical' && '!flex-col !items-start gap-y-2',
          className
        )}
      >
        <div
          className="absolute inset-0 -mt-[5px]"
          style={{
            backgroundImage: `
                linear-gradient(to right, hsl(var(--background-200)/1) 0%, hsl(var(--background-200)/1) 30%, hsl(var(--background-200)/0) 100%),
                linear-gradient(to right, hsl(var(--border-default)/0.33) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border-default)/0.33) 1px, transparent 1px)
              `,
            backgroundSize: '100% 100%, 15px 15px, 15px 15px',
            backgroundPosition: '0 0, 0 0, 0 0',
          }}
        />
        <div className="relative flex flex-col gap-y-2">
          <div className="flex flex-row items-center -space-x-px">
            <Badge
              variant={'default'}
              className="rounded-r-none pr-2 flex-shrink-0 gap-1.5 border-dashed bg-opacity-0 bg-surface-400 text-foreground-lighter"
            >
              <Megaphone size={16} strokeWidth={1.2} />
              <span className="text-foreground-lighter">{badgeLabel ?? 'Upcoming change'}</span>
            </Badge>
            <Badge
              variant="default"
              className="rounded-l-none flex-shrink-0 gap-1.5 bg-opacity-0 bg-surface-400 text-foreground-lighter border-l-0"
            >
              <span className="text-foreground text-xs">{title}</span>
            </Badge>
          </div>
          {description && (
            <div className="text-foreground-light text-sm flex flex-col gap-0">
              <div className="prose text-xs max-w-none [&_p]:mt-2 [&_p]:mb-0">{description}</div>
            </div>
          )}
        </div>
        {href && (
          <Button size="tiny" type="default" className="text-xs" asChild>
            <a href={href} target="_blank" rel="noreferrer noopener">
              {buttonText ?? 'Read the accouncement'}
            </a>
          </Button>
        )}
      </div>
    )
  }
)

PanelNotice.displayName = 'PanelNotice'

Panel.Content = Content
Panel.Footer = Footer
Panel.Notice = PanelNotice
export default Panel
