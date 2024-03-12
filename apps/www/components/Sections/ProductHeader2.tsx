import React from 'react'
import { Button } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'
import SectionContainer from '../Layouts/SectionContainer'
import { CTA } from '~/types/common'

interface Props {
  h1: string | React.ReactNode
  subheader?: string[] | React.ReactNode[]
  icon?: string
  title?: string
  image?: React.ReactNode
  footer?: React.ReactNode
  ctas?: CTA[]
}

const ProductHeader = (props: Props) => (
  <div className="w-full relative mx-auto py-16 pb-0 lg:py-24 border-b bg-alternative">
    <SectionContainer className="!py-0 grid grid-cols-12">
      <div className="col-span-12 gap-8 lg:col-span-5">
        <div>
          {(props.icon || props.title) && (
            <div className="mb-4 flex items-center gap-3">
              {props.icon && <ProductIcon icon={props.icon} />}
              {props.title && (
                <span
                  className="text-brand font-mono uppercase"
                  key={`product-name-${props.title}`}
                >
                  {props.title}
                </span>
              )}
            </div>
          )}
          <h1 className="h1 text-3xl md:!text-4xl lg:!text-5xl 2xl:!text-6xl tracking-[-.15px]">
            {props.h1}
          </h1>
        </div>
        <div>
          {props.subheader &&
            props.subheader.map((subheader, i) => {
              return (
                <p className="p lg:text-lg" key={i}>
                  {subheader}
                </p>
              )
            })}
        </div>
        <div className="flex flex-row md:flex-row md:items-center gap-2">
          {props.ctas?.map((cta) => (
            <Button
              key={cta.href}
              size="medium"
              type={cta.type ?? 'default'}
              className="text-white"
              asChild
            >
              <Link href={cta.href}>{cta.label ?? 'Start for free'}</Link>
            </Button>
          ))}
        </div>
      </div>
      {props.image && (
        <div className="col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
      {props.footer && <div className="mt-4 md:mt-8 lg:mt-32 col-span-12">{props.footer}</div>}
    </SectionContainer>
  </div>
)

export default ProductHeader
