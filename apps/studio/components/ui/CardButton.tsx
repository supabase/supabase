import { Loader, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React, { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface CardButtonProps {
  title?: string | React.ReactNode
  description?: string
  footer?: React.ReactNode
  url?: string
  linkHref?: string
  imgUrl?: string
  imgAlt?: string
  onClick?: () => void
  icon?: React.ReactNode
  loading?: boolean
  className?: string
  fixedHeight?: boolean
  hideChevron?: boolean
  titleClass?: string
}

// Define separate interfaces for each type of container
interface LinkContainerProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  href: string
}

interface UrlContainerProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  href: string
}

interface NonLinkContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {}

interface ButtonContainerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {}

// Union of all container props
type ContainerProps =
  | LinkContainerProps
  | UrlContainerProps
  | NonLinkContainerProps
  | ButtonContainerProps

const CardButton = ({
  title,
  description,
  children,
  footer,
  url = '',
  linkHref = '',
  imgUrl,
  imgAlt,
  icon,
  className,
  loading = false,
  fixedHeight = true,
  hideChevron = false,
  titleClass = '',
  ...props
}: PropsWithChildren<CardButtonProps & ContainerProps>) => {
  const isLink = url || linkHref || props.onClick

  let Container: React.ElementType
  let containerProps: ContainerProps = {}

  if (props.onClick) {
    Container = 'button'
    containerProps = props
  } else if (linkHref) {
    Container = Link
    containerProps = {
      href: linkHref,
      ...props,
    }
  } else if (url) {
    Container = 'a'
    containerProps = {
      href: url,
      ...props,
    }
  } else {
    Container = 'div'
    containerProps = props
  }

  let containerClasses = [
    'group relative text-left',
    'bg-surface-100',
    'border border-surface',
    'rounded-md p-5 flex flex-row',
    'transition ease-in-out duration-150',
  ]

  if (isLink) {
    containerClasses = [
      ...containerClasses,
      'cursor-pointer',
      'hover:bg-surface-200',
      'hover:border-control',
    ]
  }

  if (fixedHeight) {
    containerClasses = [...containerClasses, 'h-32']
  }

  const ImageContainer = ({ children }: { children: React.ReactNode }) => {
    return <div className="mr-4 flex flex-col">{children}</div>
  }

  const contents = (
    <>
      {imgUrl && (
        <ImageContainer>
          <img
            className="
              transition-all
              group-hover:scale-110
            "
            src={`${imgUrl}`}
            alt={`${imgAlt}`}
            width="26"
          />
        </ImageContainer>
      )}
      {icon && <ImageContainer>{icon}</ImageContainer>}
      <div className="flex h-full w-full flex-col space-y-2">
        {typeof title === 'string' ? (
          <h5 className={`text-foreground pr-5 ${titleClass}`}>{title}</h5>
        ) : (
          title
        )}
        {(children || description) && (
          <div className="flex w-full flex-1 flex-col">
            <p className="text-sm text-foreground-light">{description}</p>
            <div className="w-full">{children && children}</div>
          </div>
        )}
        {footer && <div className="w-full !mt-auto">{footer}</div>}
      </div>
      {isLink && (
        <div
          className="
          absolute
          right-4
          top-4
          text-foreground-lighter
          transition-all
          duration-200
          group-hover:right-3
          group-hover:text-foreground
        "
        >
          {loading ? <Loader className="animate-spin" /> : !hideChevron ? <ChevronRight /> : <></>}
        </div>
      )}
    </>
  )

  return (
    <Container {...containerProps} className={cn(containerClasses, className)}>
      {contents}
    </Container>
  )
}

export default CardButton
