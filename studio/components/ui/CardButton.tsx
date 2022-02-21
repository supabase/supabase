import React, { FC } from 'react'
import { IconChevronRight } from '@supabase/ui'
import Link from 'next/link'

interface Props {
  title: string | React.ReactNode
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  url?: string
  linkHref?: string
  imgUrl?: string
  imgAlt?: string
  onClick?: () => void
  icon?: React.ReactNode
}

const CardButton: FC<Props> = ({
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
}) => {
  const LinkContainer = ({ children }: { children: React.ReactNode }) => (
    <Link href={linkHref}>{children}</Link>
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
    'rounded-md py-4 px-6 flex flex-row h-32',
    'transition ease-in-out duration-150',
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
    return <div className="flex flex-col mr-4">{children}</div>
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
      <div className="flex flex-col space-y-2 w-full h-full">
        <h5 className="text-scale-1200">{title}</h5>
        <div className="flex flex-col flex-1 w-full">
          <p className="text-scale-1100 text-sm">{description}</p>
          <div className="w-full">{children && children}</div>
        </div>
        <div className="w-full">{footer && footer}</div>
      </div>
      {isLink && (
        <div
          className="
          absolute
          right-4
          top-3
          text-scale-900
          transition-all 
          duration-200 
          group-hover:right-3
          group-hover:text-scale-1200
        "
        >
          <IconChevronRight />
        </div>
      )}
    </div>
  )

  if (onClick) {
    return <ButtonContainer children={contents} />
  } else if (linkHref) {
    return <LinkContainer children={contents} />
  } else if (url) {
    return <UrlContainer children={contents} />
  } else {
    return <NonLinkContainer children={contents} />
  }
}

export default CardButton
