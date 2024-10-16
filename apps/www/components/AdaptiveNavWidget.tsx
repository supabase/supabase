import { useState, useEffect, useRef, PropsWithChildren } from 'react'
import Link from 'next/link'
import { useScroll } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from 'ui'

interface Props {
  className?: string
  wrapperClassName?: string
  prevLink: string
  nextLink: string
}

const AdaptiveNavWidget: React.FC<Props> = ({
  className,
  wrapperClassName,
  prevLink,
  nextLink,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [parentWidth, setParentWidth] = useState(0)
  const [widgetWidth, setWidgetWidth] = useState(0)
  const { scrollY } = useScroll()
  const widgetRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const updateDimensions = () => {
    if (parentRef.current && widgetRef.current) {
      setParentWidth(parentRef.current.clientWidth)
      setWidgetWidth(widgetRef.current.clientWidth)
    }
  }

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    const unsubscribeScroll = scrollY.onChange((latest) => {
      setIsExpanded(latest > 80)
    })

    return () => {
      window.removeEventListener('resize', updateDimensions)
      unsubscribeScroll()
    }
  }, [scrollY])

  useEffect(() => {
    setTimeout(updateDimensions, 200)
  }, [isExpanded])

  const translateX = isExpanded ? `-${parentWidth / 2 - widgetWidth / 2}px` : '0px'

  return (
    <div
      ref={parentRef}
      className={cn(
        'z-50 h-full w-full max-w-2xl absolute mx-auto inset-0 pointer-events-none',
        wrapperClassName
      )}
      {...props}
    >
      <div
        ref={widgetRef}
        className={cn(
          'sticky top-[100px] mb-20 w-fit pointer-events-auto flex items-center text-sm gap-1 text-foreground-light p-1 rounded-full transition-all !ease-in-out',
          'left-full !ease-[.24,0,.22,.99] duration-300 delay-200',
          isExpanded ? 'delay-200' : 'delay-0',
          className
        )}
        style={{ transform: `translateX(${translateX})` }}
      >
        <ButtonLink
          href={prevLink}
          isExpanded={isExpanded}
          className={cn('text-right pl-2', isExpanded && 'pr-3')}
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap flex-grow opacity-0 transition-opacity invisible hidden',
              isExpanded && 'opacity-100 visible inline'
            )}
          >
            Previous
          </span>
        </ButtonLink>
        <ButtonLink
          href={nextLink}
          isExpanded={isExpanded}
          className={cn('text-left', isExpanded && 'pl-3')}
        >
          <span
            className={cn(
              'flex-grow text-foreground-light whitespace-nowrap opacity-0 transition-opacity invisible hidden',
              isExpanded && 'opacity-100 visible inline'
            )}
          >
            Next
          </span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </ButtonLink>
        <div
          className={cn(
            'absolute z-0 pointer-events-none inset-0 w-full h-full border rounded-full border-default bg-default transition-opacity shadow-lg',
            isExpanded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </div>
  )
}

interface ButtonLinkProps {
  href: string
  isExpanded: boolean
  className?: string
}

const ButtonLink: React.FC<PropsWithChildren<ButtonLinkProps>> = ({
  href,
  isExpanded,
  className,
  children,
}) => {
  return (
    <Link
      href={href}
      className={cn(
        'relative z-10 flex items-center gap-1 px-2 pointer-events-auto overflow-hidden !h-[30px] !min-w-[30px] py-1 justify-center rounded-full border bg-default hover:bg-surface-100 hover:text-foreground transition-all',
        isExpanded ? 'w-[100px]' : '!w-[30px] !max-w-[30px]',
        className
      )}
    >
      {children}
    </Link>
  )
}

export default AdaptiveNavWidget
