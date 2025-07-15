import { PropsWithChildren, useEffect, useState } from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, ArrowRight, List } from 'lucide-react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { type FeatureType, features } from '~/data/features'

interface Props {
  className?: string
  wrapperClassName?: string
  currentFeature: FeatureType
  prevLink: string
  nextLink: string
}

const buttonClassName =
  'relative z-10 flex items-center gap-1 px-2 pointer-events-auto overflow-hidden !h-[30px] !min-w-[30px] !max-w-[30px] py-1 justify-center rounded-full border bg-default hover:bg-surface-100 hover:text-foreground hover:border-foreground-lighter transition-all'
const iconClassName = 'className="w-4 h-4 flex-shrink-0'

const PrevNextFeatureNav: React.FC<Props> = ({
  className,
  wrapperClassName,
  currentFeature,
  prevLink,
  nextLink,
  ...props
}) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function handleRouteChange() {
      setOpen(false)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <div
      className={cn(
        'h-full w-full max-w-2xl absolute mx-auto inset-0 pointer-events-none',
        wrapperClassName
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute top-9 w-fit pointer-events-auto flex items-center text-sm gap-1 text-foreground-light right-8 md:right-0',
          className
        )}
      >
        <ButtonLink href={prevLink} className="text-right pl-2">
          <ArrowLeft className={iconClassName} />
          <span className="sr-only">Previous feature</span>
        </ButtonLink>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger className={cn(buttonClassName, 'p-0')}>
            <List className={iconClassName} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" alignOffset={-38} className="pb-0">
            <DropdownMenuItem asChild className="text-foreground-lighter p-0">
              <Link
                href="/features"
                as="/features"
                className="group/link flex items-center gap-2 px-2 py-1.5 w-full hover:text-foreground"
              >
                <span className="truncate flex-grow">All Features</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mb-0" />
            <DropdownMenuGroup className="max-h-[400px] overflow-y-scroll py-1">
              {features
                .sort((a, b) => {
                  if (a['title'] < b['title']) return -1
                  if (a['title'] > b['title']) return 1
                  return 0
                })
                .map((feature) => (
                  <DropdownMenuItem asChild key={feature.slug} className="p-0">
                    <Link
                      href={`/features/${feature.slug}`}
                      as={`/features/${feature.slug}`}
                      className="group/link flex items-center gap-2 px-2 py-1.5 w-full hover:text-foreground"
                    >
                      <feature.icon className="w-3 h-3 text-foreground-lighter group-hover:text-foreground transition-colors" />
                      <span className="line-clamp-1 flex-grow">{feature.title}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ButtonLink href={nextLink}>
          <span className="sr-only">Next feature</span>
          <ArrowRight className={iconClassName} />
        </ButtonLink>
      </div>
    </div>
  )
}

interface ButtonLinkProps extends LinkProps {
  className?: string
}

const ButtonLink: React.FC<PropsWithChildren<ButtonLinkProps>> = ({
  href,
  className,
  children,
}) => {
  return (
    <Link href={href} className={cn(buttonClassName, className)}>
      {children}
    </Link>
  )
}

export default PrevNextFeatureNav
