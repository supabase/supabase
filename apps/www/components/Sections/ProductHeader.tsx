import { Button, IconBookOpen } from 'ui'
import Link from 'next/link'
import ProductIcon from '../ProductIcon'

type subheader = string
interface Types {
  h1: string | React.ReactNode
  subheader: string[]
  icon?: string
  title?: string
  image?: React.ReactNode
  footer?: React.ReactNode
  documentation_url?: string
}

const ProductHeader = (props: Types) => (
  <div className="container relative mx-auto px-6 pt-16 pb-0 sm:px-16 lg:pt-32 xl:px-20">
    <div className="grid grid-cols-12">
      <div className="col-span-12 space-y-8 lg:col-span-5">
        <div>
          {props.icon || props.title ? (
            <div className="mb-4 flex items-center gap-3">
              {props.icon && <ProductIcon icon={props.icon} />}
              {props.title && (
                <span className="text-foreground" key={`product-name-${props.title}`}>
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
          <Button asChild size="medium" className="text-white">
            <Link href="https://supabase.com/dashboard" as="https://supabase.com/dashboard">
              Start a project
            </Link>
          </Button>
          {props.documentation_url && (
            <Button asChild type="default" size="medium" icon={<IconBookOpen />}>
              <Link href={props.documentation_url} as={props.documentation_url} className="ml-2">
                See documentation
              </Link>
            </Button>
          )}
        </div>
        {props.footer && <div className="mb-4">{props.footer}</div>}
      </div>
      {props.image && (
        <div className="col-span-12 mt-8 lg:col-span-7 lg:mt-0 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
    </div>
  </div>
)

export default ProductHeader
