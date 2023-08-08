import Link from 'next/link'
import React, { PropsWithChildren } from 'react'
import { IconChevronRight, IconLoader } from 'ui'

interface CardButtonProps {
  title: string | React.ReactNode
  description?: string
  footer?: React.ReactNode
  url?: string
  linkHref?: string
  imgUrl?: string
  imgAlt?: string
  onClick?: () => void
  icon?: React.ReactNode
  containerHeightClassName?: string
  loading?: boolean
}

const CardButton = ({
  title,
  description,
  children,
  footer,
  url = '',
  linkHref = '',
  imgUrl,
  imgAlt,
  onClick,
  icon,
  containerHeightClassName = 'h-32',
  loading = false,
}: PropsWithChildren<CardButtonProps>) => {
  const LinkContainer = ({ children }: { children: React.ReactNode }) => (
    <Link href={linkHref}>
      <a>{children}</a>
    </Link>
  )
  const UrlContainer = ({ children }: { children: React.ReactNode }) => <a href={url}>{children}</a>
  const NonLinkContainer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  const ButtonContainer = ({ children }: { children: React.ReactNode }) => (
    <button onClick={onClick}>{children}</button>
  )

  const isLink = url || linkHref || onClick

  let containerClasses = [
    'group relative text-left',
    'bg-panel-header-light dark:bg-panel-header-dark',
    'border border-panel-border-light dark:border-panel-border-dark',
    'rounded-md py-4 px-6 flex flex-row',
    'transition ease-in-out duration-150',
    containerHeightClassName,
  ]

  if (isLink) {
    containerClasses = [
      ...containerClasses,
      'cursor-pointer',
      'hover:bg-panel-border-light dark:hover:bg-panel-border-dark',
      'hover:border-panel-border-hover-light',
      'dark:hover:border-panel-border-hover-dark hover:border-gray-300',
    ]
  }

  const ImageContainer = ({ children }: { children: React.ReactNode }) => {
    return <div className="mr-4 flex flex-col">{children}</div>
  }

  const contents = (
    <div className={containerClasses.join(' ')}>
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
        {typeof title === 'string' ? <h5 className="text-scale-1200">{title}</h5> : title}
        {(children || description) && (
          <div className="flex w-full flex-1 flex-col">
            <p className="text-sm text-scale-1100">{description}</p>
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
          text-scale-900
          transition-all
          duration-200
          group-hover:right-3
          group-hover:text-scale-1200
        "
        >
          {loading ? <IconLoader className="animate-spin" /> : <IconChevronRight />}
        </div>
      )}
    </div>
  )

  if (onClick) {
    return <ButtonContainer>{contents}</ButtonContainer>
  } else if (linkHref) {
    return <LinkContainer>{contents}</LinkContainer>
  } else if (url) {
    return <UrlContainer>{contents}</UrlContainer>
  } else {
    return <NonLinkContainer>{contents}</NonLinkContainer>
  }
}

export default CardButton
