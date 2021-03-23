import { Button, IconBookOpen, IconKey, Space, Typography } from '@supabase/ui'
import ProductIcon from '../ProductIcon'

type subheader = string
interface Types {
  h1: string | React.ReactNode
  subheader: string[]
  icon?: string
  title?: string
}

const ProductHeader = (props: Types) => (
  <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative py-32">
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-6">
        {props.icon || props.title ? (
          <div className="flex flex-row mb-4 item-center">
            {props.icon && <ProductIcon icon={props.icon} />}
            {props.title && (
              <Typography.Title level={4} className="ml-3">
                {props.title}
              </Typography.Title>
            )}
          </div>
        ) : null}
        <Typography.Title>{props.h1}</Typography.Title>
        {props.subheader && (
          <Typography.Text>
            {props.subheader.map((subheader) => {
              return <p className="text-lg">{subheader}</p>
            })}
          </Typography.Text>
        )}
        <Space className="mt-12">
          <Button size="medium">Start a project</Button>
          <Button type="text" size="medium" icon={<IconBookOpen />}>
            See documentation
          </Button>
        </Space>
      </div>
    </div>
  </div>
)

export default ProductHeader
