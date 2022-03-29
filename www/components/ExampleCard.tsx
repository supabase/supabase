import { Button, Divider, IconArrowUpRight, IconGitHub, IconTriangle, Space } from '@supabase/ui'
import Link from 'next/link'

function ExampleCard(props: any) {
  return (
    <>
      <div
        className="h-40 
          bg-white 
          dark:bg-scale-300 
          border 
          border-scale-400
          border-t border-r border-l 
          p-5
          flex flex-col justify-between
          rounded rounded-b-none
          "
      >
        <div className="mb-4">
          <h4 className="h6">{props.title}</h4>
          <p className="p text-sm">{props.description}</p>
          <div>
            <img src={props.author_img} className="inline w-6 rounded-full border-scale-500" />
            <span className="text-sm ml-2 text-scale-1200">{props.author}</span>
          </div>
        </div>
      </div>
      <Divider light />
      <div>
        <div
          className="
          bg-scale-100
          dark:bg-scale-400
          border border-scale-400
          border-b border-r border-l border-t-0
          p-5
          flex flex-col justify-between
          rounded rounded-t-none"
        >
          <Link href={props.repo_url} as={props.repo_url} passHref>
            <a
              className="text-sm text-scale-1100 hover:text-scale-1200 flex flex-row items-center"
              target="_blank"
            >
              <span>{props.repo_name}</span>
              <span className="ml-1 inline-block">
                <IconGitHub size={14} />
              </span>
            </a>
          </Link>

          <div className="flex gap-2 items-center mt-3">
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
          </div>
        </div>
      </div>
    </>
  )
}

export default ExampleCard
