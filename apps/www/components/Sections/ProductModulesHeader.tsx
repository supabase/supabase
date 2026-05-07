import Image from 'next/image'
import Link from 'next/link'
import { Button, cn } from 'ui'
import styles from '~/styles/animations.module.css'
import AnnouncementBadge from '../Announcement/Badge'
import { PlayCircle } from 'lucide-react'

interface Types {
  h1: string | React.ReactNode
  subheader: string | React.ReactNode
  icon?: string
  className?: string
  title?: string
  image?: string | React.ReactNode
  footer?: React.ReactNode
  announcement?: {
    url: string
    announcement: string
    badge?: string
    target?: '_self' | '_blank' | string
  }
  cta?: {
    label?: string
    link: string
  }
  secondaryCta?: {
    label?: string
    link: string
  }
  video?: string
}

const ProductModulesHeader = (props: Types) => (
  <div
    className={cn(
      'container relative w-full mx-auto px-6 pt-2 pb-0 sm:px-16 xl:px-20',
      props.className
    )}
  >
    <div className="flex flex-col text-center items-center">
      {/* {props.image &&
        (props.image && typeof props.image === 'string' ? (
          <div className="relative w-full max-w-[630px] mx-auto z-0 aspect-[2.3/1] -mt-8 -mb-8 md:-mb-12 lg:-mb-24">
            <Image
              src={props.image}
              priority
              layout="fill"
              objectFit="contain"
              objectPosition="top"
              alt=""
            />
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-7 -mb-12 lg:mt-0 xl:col-span-6 xl:col-start-7">
            {props.image}
          </div>
        ))} */}
      <div className="w-12 h-12 min-w-12 shrink-0 my-4 md:mt-8 bg-background border flex items-center justify-center rounded-md">
        <svg
          className="h-6 w-6 text-foreground-light group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
            d={props.icon}
            stroke="currentColor"
          />
        </svg>
      </div>
      <div className="relative w-full z-10 flex flex-col items-center space-y-2 mx-auto max-w-2xl">
        <div>
          {props.icon || props.title ? (
            <div className="mb-2 flex justify-center items-center gap-3">
              {/* {props.icon && <ProductIcon icon={props.icon} />} */}
              {props.title && (
                <span
                  className="text-brand font-mono uppercase tracking-widest text-sm"
                  key={`product-name-${props.title}`}
                >
                  {props.title}
                </span>
              )}
            </div>
          ) : null}
        </div>
        {props.announcement && <AnnouncementBadge {...props.announcement} className="pb-2 z-10" />}
        <div
          className={cn(
            'will-change-transform flex flex-col gap-4 items-center',
            styles['appear-from-bottom']
          )}
        >
          <h1 className="text-3xl md:text-5xl tracking-[-.5px] max-w-lg" key={`h1`}>
            {props.h1}
          </h1>
          <p className="p !text-foreground-light">{props.subheader}</p>
        </div>
        <div className="w-full sm:w-auto flex flex-col items-stretch sm:flex-row pt-2 sm:items-center gap-2">
          {props.cta && (
            <Button size="small" className="text-white" asChild>
              <Link href={props.cta.link} as={props.cta.link}>
                {props.cta.label ?? 'Start for free'}
              </Link>
            </Button>
          )}
          {props.video && (
            <Button type="default" size="small" icon={<PlayCircle />} asChild>
              <Link href={props.video} as={props.video}>
                Watch video
              </Link>
            </Button>
          )}
          {props.secondaryCta && (
            <Button type="default" size="small" asChild>
              <Link href={props.secondaryCta.link} as={props.secondaryCta.link}>
                {props.secondaryCta.label}
              </Link>
            </Button>
          )}
        </div>
        {props.footer && <div className="mb-4">{props.footer}</div>}
      </div>
    </div>
  </div>
)

export default ProductModulesHeader
