import { Button, Divider, IconArrowUpRight, IconGitHub, IconTriangle, Space } from 'ui'
import Link from 'next/link'

function ExampleCard(props: any) {
  return (
    <>
      <div
        className="dark:bg-scale-300
          border-scale-400
          flex
          h-40
          flex-col
          justify-between rounded rounded-b-none
          border
          border-t border-r border-l
          bg-white p-5
          "
      >
        <div className="mb-4">
          <h4 className="h6">{props.title}</h4>
          <p className="p text-sm">{props.description}</p>
          <div>
            <img
              src={props.author_img}
              alt={props.author + ' GitHub profile picture'}
              className="border-scale-500 inline w-6 rounded-full"
            />
            <span className="text-scale-1200 ml-2 text-sm">{props.author}</span>
          </div>
        </div>
      </div>
      <Divider light />
      <div>
        <div
          className="
          bg-scale-100
          dark:bg-scale-400
          border-scale-400 flex
          flex-col justify-between rounded rounded-t-none
          border
          border-b border-r border-l
          border-t-0 p-5"
        >
          <Link href={props.repo_url} as={props.repo_url} passHref>
            <a
              className="text-scale-1100 hover:text-scale-1200 flex flex-row items-center text-sm"
              target="_blank"
            >
              <span>{props.repo_name}</span>
              <span className="ml-1 inline-block">
                <IconGitHub size={14} />
              </span>
            </a>
          </Link>

          <div className="mt-3 flex items-center gap-2">
            {props.vercel_deploy_url && (
              <a target="_blank" href={props.vercel_deploy_url}>
                <img className="h-6" src="https://vercel.com/button" alt="vercel button" />
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
