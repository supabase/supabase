import { Button, IconPlayCircle, cn } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'
import Image from 'next/image'
import styles from '~/styles/animations.module.css'
import AnnouncementBadge from '../Announcement/Badge'

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

const ProductHeaderCentered = (props: Types) => (
  <div
    className={cn(
      'container relative w-full mx-auto px-6 pt-2 pb-0 sm:px-16 xl:px-20',
      props.className
    )}
  >
    <div className="flex flex-col text-center items-center">
      {props.image && typeof props.image === 'string' ? (
        <div className="relative w-full max-w-[630px] mx-auto z-0 aspect-[2.3/1] -mt-8 -mb-8 md:-mb-12 lg:-mb-12">
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
        <div className="col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
      <div className="relative w-full z-10 flex flex-col items-center space-y-2 mx-auto max-w-2xl">
        {props.announcement && (
          <AnnouncementBadge {...props.announcement} className="pb-4 md:pb-4 z-10" />
        )}
        <div>
          {props.icon || props.title ? (
            <div className="mb-2 flex justify-center items-center gap-3">
              {props.icon && <ProductIcon icon={props.icon} />}
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
        <div className={cn(styles['appear-from-bottom'])}>
          <h1 className="h1 text-3xl md:text-4xl tracking-[-1.5px]" key={`h1`}>
            {props.h1}
          </h1>
          <p className="p !text-foreground-light">{props.subheader}</p>
        </div>
        <div className="w-full sm:w-auto flex flex-col items-stretch sm:flex-row pt-2 sm:items-center gap-2">
          {props.cta && (
            <Button size="medium" className="text-white" asChild>
              <Link href={props.cta.link} as={props.cta.link}>
                {props.cta.label ?? 'Start for free'}
              </Link>
            </Button>
          )}
          {props.video && (
            <Button type="default" size="medium" icon={<IconPlayCircle />} asChild>
              <Link href={props.video} as={props.video}>
                Watch video
              </Link>
            </Button>
          )}
          {props.secondaryCta && (
            <Button type="default" size="medium" asChild>
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

export default ProductHeaderCentered
