import { Button, IconBookOpen, IconKey, Space, Typography } from '@supabase/ui'

type subheader = string
interface Types {
  h1: string | React.ReactNode
  subheader: string[]
}

const ProductHeader = (props: Types) => (
  <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative py-32">
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-6">
        <div className="flex flex-row mb-4 item-center">
          <div className="w-8 h-8 bg-gray-800 dark:bg-white text-white dark:text-gray-800 flex rounded items-center justify-center">
            <IconKey strokeWidth="2px" size="tiny" />
          </div>
          <Typography.Title level={4} className="ml-3">
            Auth
          </Typography.Title>
        </div>
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
