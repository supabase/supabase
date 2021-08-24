import {
  Button,
  Divider,
  IconArrowUpRight,
  IconGitHub,
  IconTriangle,
  Space,
  Typography,
} from '@supabase/ui'
import Link from 'next/link'

function ExampleCard(props: any) {
  return (
    <>
      <div
        className="h-40 bg-white dark:bg-gray-700 
          border-t border-r border-l border-gray-100 dark:border-gray-600
          p-5
          flex flex-col justify-between
          rounded rounded-b-none
          "
      >
        <div className="mb-4">
          <Typography.Title level={5} className="mb-1">
            {props.title}
          </Typography.Title>
          <Typography.Text className="block">
            <p>{props.description}</p>
            <div className="flex flex-row items-center mb-2">
              Created by:
              <img
                src={props.author_img}
                className="ml-2 inline w-6 rounded-full border dark:border-gray-500"
              />
              <span className="ml-2">{props.author}</span>
            </div>
          </Typography.Text>
        </div>
      </div>
      <Divider light />
      <div>
        <div
          className="
          bg-white dark:bg-gray-800 
          border-b border-r border-l border-gray-100 dark:border-gray-600
          p-5
          flex flex-col justify-between
          rounded rounded-t-none"
        >
          <Typography.Text>
            <Link href={props.repo_url} as={props.repo_url}>
              <a className="flex flex-row items-center" target="_blank">
                <span>{props.repo_name}</span>
                <span className="ml-1 inline-block">
                  <IconGitHub size="small" />
                </span>
              </a>
            </Link>
          </Typography.Text>
          <Space className="mt-3">
            {props.vercel_deploy_url && (
              <a target="_blank" href={props.vercel_deploy_url}>
                <img src="https://vercel.com/button" />
              </a>
            )}
            {props.demo_url && (
              <Link href={props.demo_url} as={props.demo_url}>
                <a target="_blank">
                  <Button size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                    Launch Demo
                  </Button>
                </a>
              </Link>
            )}
            {!props.demo_url && (
              <Link href={props.repo_url} as={props.repo_url}>
                <a target="_blank">
                  <Button size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                    View Code
                  </Button>
                </a>
              </Link>
            )}
          </Space>
        </div>
      </div>
    </>
  )
}

export default ExampleCard
