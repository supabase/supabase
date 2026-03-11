import React from 'react'
import { Button, cn } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'
import SectionContainer from '../Layouts/SectionContainer'
import { CTA } from '~/types/common'

// to do: move types to be global
// then solutions.types.ts should extend this
interface Props {
  label?: string | React.ReactNode
  h1: string | React.ReactNode
  subheader?: string[] | React.ReactNode[]
  icon?: string
  title?: string
  image?: React.ReactNode
  footer?: React.ReactNode
  footerPosition?: 'left' | 'bottom' | 'right'
  ctas?: CTA[]
  className?: string
  sectionContainerClassName?: string
}

const ProductHeader = ({ footerPosition = 'left', ...props }: Props) => (
  <div
    className={cn(
      'w-full max-w-full relative mx-auto py-16 lg:py-24 border-b bg-alternative overflow-hidden',
      props.className
    )}
  >
    <SectionContainer className={cn('!py-0 grid grid-cols-12', props.sectionContainerClassName)}>
      <div
        className={cn(
          'relative z-10 col-span-12 lg:col-span-5',
          // if not image is present, center the content
          !props.image && 'lg:col-start-4 lg:col-end-10 text-center flex flex-col items-center'
        )}
      >
        {(props.icon || props.title) && (
          <div className="mb-4 flex items-center gap-3">
            {props.icon && <ProductIcon icon={props.icon} />}
            {props.title && (
              <span
                className="text-brand-600 dark:text-brand font-mono uppercase"
                key={`product-name-${props.title}`}
              >
                {props.title}
              </span>
            )}
          </div>
        )}
        <h1 className="h1 text-3xl md:!text-4xl lg:!text-4xl 2xl:!text-6xl tracking-[-.15px]">
          {props.h1}
        </h1>
        {props.subheader && (
          <div className="">
            {props.subheader.map((subheader, i) => {
              return (
                <p className="p lg:text-lg max-w-lg lg:max-w-none" key={i}>
                  {subheader}
                </p>
              )
            })}
          </div>
        )}
        <div className="flex flex-row md:flex-row md:items-center gap-2 mt-4">
          {props.ctas?.map((cta) => (
            <Button
              key={cta.href}
              size="medium"
              type={cta.type ?? 'default'}
              onClick={cta.onClick}
              asChild
            >
              <Link href={cta.href}>{cta.label ?? 'Start for free'}</Link>
            </Button>
          ))}
        </div>
        {props.footer && footerPosition === 'left' && (
          <div className="ph-footer relative z-10 mt-4 md:mt-8 lg:mt-20 xl:mt-32 col-span-12">
            {props.footer}
          </div>
        )}
      </div>
      {props.image && (
        <div className="image-container relative min-h-[300px] col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
      {props.footer && footerPosition !== 'left' && (
        <div className="relative z-10 mt-4 md:mt-8 lg:mt-20 xl:mt-32 col-span-12">
          {props.footer}
        </div>
      )}
    </SectionContainer>
  </div>
)

export default ProductHeader
