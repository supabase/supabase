import { IconGitHub, Typography } from '@supabase/ui'

function ExampleCard(props: any) {
  return (
    <div
      className="
          mr-3 ml-3 my-8 
          bg-white dark:bg-gray-700 
          border border-gray-100 dark:border-gray-600
          p-5 h-52 
          flex flex-col justify-between
          rounded shadow-light-small dark:shadow-override"
    >
      <div>
        <Typography.Title level={5} className="mb-1">
          Supabase Auth x NextJS
        </Typography.Title>
        <Typography.Text>
          NextJS based Auth example, with support for Server side rendering
        </Typography.Text>
      </div>
      <div>
        <Typography.Text>
          <div className="flex flex-row items-center mb-2">
            Created by <img src={props.author_img} className="ml-2 inline w-5 rounded-full" />
            <span className="ml-1">{props.author}</span>
          </div>
          <a className="flex flex-row items-center">
            <span>{props.repo_name}</span>
            <span className="ml-1 inline-block">
              <IconGitHub size="small" />
            </span>
          </a>
        </Typography.Text>
      </div>
    </div>
  )
}

export default ExampleCard
