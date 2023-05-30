import { Button, IconPlayCircle } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'
import Image from 'next/image'
import styles from '~/styles/animations.module.css'

interface Types {
  h1: string | React.ReactNode
  subheader: string | React.ReactNode
  icon?: string
  title?: string
  image?: string | React.ReactNode
  footer?: React.ReactNode
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
  <div className="container relative w-full mx-auto px-6 pt-4 pb-0 sm:px-16 xl:px-20">
    <div className="flex flex-col text-center items-center">
      {props.image && typeof props.image === 'string' ? (
        <div className="relative w-full max-w-[830px] mx-auto z-0 aspect-[2.3/1] -mb-8 md:-mb-12 lg:-mb-16">
          <Image
            src={props.image}
            priority
            layout="fill"
            objectFit="contain"
            objectPosition="top"
          />
        </div>
      ) : (
        <div className="col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center space-y-2 mx-auto max-w-2xl">
        <div>
          {props.icon || props.title ? (
            <div className="mb-4 flex justify-center items-center gap-3">
              {props.icon && <ProductIcon icon={props.icon} />}
              {props.title && (
                <span
                  className="text-brand-900 font-mono uppercase tracking-widest text-sm"
                  key={`product-name-${props.title}`}
                >
                  {props.title}
                </span>
              )}
            </div>
          ) : null}
        </div>
        <div className={[styles['appear-from-bottom']].join(' ')}>
          <h1 className="h1 text-3xl md:text-4xl tracking-[-1px]" key={`h1`}>
            {props.h1}
          </h1>
          <p className="p !text-scale-1000">{props.subheader}</p>
        </div>
        <div className="flex flex-row md:flex-row pt-8 md:items-center">
          {props.cta && (
            <Link href={props.cta.link} as={props.cta.link}>
              <a>
                <Button size="medium" className="text-white">
                  {props.cta.label ?? 'Start for free'}
                </Button>
              </a>
            </Link>
          )}
          {props.video && (
            <Link href={props.video} as={props.video}>
              <a className="ml-2">
                <Button type="default" size="medium" icon={<IconPlayCircle />}>
                  Watch video
                </Button>
              </a>
            </Link>
          )}
          {props.secondaryCta && (
            <Link href={props.secondaryCta.link} as={props.secondaryCta.link}>
              <a className="ml-2 md:ml-3">
                <Button type="default" size="medium">
                  {props.secondaryCta.label}
                </Button>
              </a>
            </Link>
          )}
        </div>
        {props.footer && <div className="mb-4">{props.footer}</div>}
      </div>
    </div>
  </div>
)

export default ProductHeaderCentered
