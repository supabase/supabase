import { Button, IconBookOpen, IconKey, Space, Typography } from '@supabase/ui'
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
  <div className="container mx-auto px-6 sm:px-16 xl:px-20 relative pt-16 lg:pt-32 pb-0">
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-5">
        {props.icon || props.title ? (
          <div className="flex flex-row mb-4 item-center">
            {props.icon && <ProductIcon icon={props.icon} />}
            {props.title && (
              <Typography.Title level={4} className="ml-3" key={`product-name-${props.title}`}>
                {props.title}
              </Typography.Title>
            )}
          </div>
        ) : null}
        <Typography.Title level={1} key={`h1`}>
          {props.h1}
        </Typography.Title>
        {props.subheader && (
          <Typography.Text>
            {props.subheader.map((subheader, i) => {
              return (
                <p className="lg:text-lg" key={i}>
                  {subheader}
                </p>
              )
            })}
          </Typography.Text>
        )}
        <div className="mt-12 flex flex-row md:flex-row md:items-center">
          <Link href="https://app.supabase.io/api/login" as="https://app.supabase.io/api/login">
            <a>
              <Button size="medium">Start a project</Button>
            </a>
          </Link>
          {props.documentation_url && (
            <Link href={props.documentation_url} as={props.documentation_url}>
              <a>
                <Button type="text" size="medium" icon={<IconBookOpen />}>
                  See documentation
                </Button>
              </a>
            </Link>
          )}
        </div>
        {props.footer && <div className="mb-4">{props.footer}</div>}
      </div>
      {props.image && (
        <div className="mt-8 lg:mt-0 col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7">
          {props.image}
        </div>
      )}
    </div>
  </div>
)

export default ProductHeader
