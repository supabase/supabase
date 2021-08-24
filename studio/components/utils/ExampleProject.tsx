import { Typography, IconChevronRight } from '@supabase/ui'
type ExampleProjectProps = {
  framework: string
  title: string
  description: string
  url: string
}

const iconUrl = 'https://app.supabase.io/icons/libraries/'
export default function ExampleProject({
  framework,
  title,
  description,
  url,
}: ExampleProjectProps) {
  return (
    <a href={url}>
      <div className="bg-gray-100 border border-gray-200 rounded-md p-4 flex flex-row h-32 hover:border-gray-300">
        <div className="flex flex-col mr-4">
          <img
            src={`${iconUrl}/${framework.toLowerCase()}-icon.svg`}
            alt={`${framework} logo`}
            width="26"
          />
        </div>
        <div className="space-y-4 w-4/5">
          <div>
            <Typography.Title level={5}>{title}</Typography.Title>
            <Typography.Text type="secondary">{description}</Typography.Text>
          </div>
        </div>
        <div>
          <IconChevronRight />
        </div>
      </div>
    </a>
  )
}
