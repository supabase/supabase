import { Button, IconBookOpen, IconPlayCircle } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'

interface Types {
  h1: string | React.ReactNode
  subheader: string[]
  icon?: string
  title?: string
  image?: React.ReactNode
  footer?: React.ReactNode
  documentation_url?: string
}

const ProductHeaderCentered = (props: Types) => (
  <div className="container relative mx-auto px-6 pt-16 pb-0 sm:px-16 lg:pt-32 xl:px-20">
    <div className="flex flex-col text-center items-center">
      <div className="flex flex-col items-center space-y-2 mx-auto max-w-2xl">
        <div>
          {props.icon || props.title ? (
            <div className="mb-4 flex justify-center items-center gap-3">
              {props.icon && <ProductIcon icon={props.icon} />}
              {props.title && (
                <span className="text-scale-1200" key={`product-name-${props.title}`}>
                  {props.title}
                </span>
              )}
            </div>
          ) : null}
          <h1 className="h1" key={`h1`}>
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
        <div className="flex flex-row md:flex-row md:items-center">
          <Link href="https://supabase.com/dashboard" as="https://supabase.com/dashboard">
            <a>
              <Button size="medium" className="text-white">
                Start for free
              </Button>
            </a>
          </Link>
          {props.documentation_url && (
            <Link href={props.documentation_url} as={props.documentation_url}>
              <a className="ml-2">
                <Button type="default" size="medium" icon={<IconPlayCircle />}>
                  Watch video
                </Button>
              </a>
            </Link>
          )}
        </div>
        {props.footer && <div className="mb-4">{props.footer}</div>}
      </div>
      {/* {props.image && (
        <div className="col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )} */}
    </div>
  </div>
)

export default ProductHeaderCentered
