import { Button, Divider, IconArrowUpRight, IconGitHub, IconTriangle, Space } from 'ui'
import Link from 'next/link'
import Image from 'next/image'

function ExampleCard(props: any) {
  return (
    <>
      <div
        className="bg-surface-100
          border-default
          flex
          h-40
          flex-col
          justify-between rounded rounded-b-none
          border
          border-t border-r border-l p-5
          "
      >
        <div className="mb-4">
          <h4 className="h6">{props.title}</h4>
          <p className="p text-sm">{props.description}</p>
          <div className="flex items-center">
            <div className="relative border border-default inline !w-6 !h-6 rounded-full overflow-hidden">
              <Image
                src={props.author_img}
                alt={props.author + ' GitHub profile picture'}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <span className="text-foreground ml-2 text-sm">{props.author}</span>
          </div>
        </div>
      </div>
      <Divider light />
      <div>
        <div
          className="
          bg-surface-200
          border-default flex
          flex-col justify-between rounded rounded-t-none
          border
          border-b border-r border-l
          border-t-0 p-5"
        >
          <Link
            href={props.repo_url}
            as={props.repo_url}
            className="text-foreground-light hover:text-foreground flex flex-row items-center text-sm"
            target="_blank"
          >
            <span>{props.repo_name}</span>
            <span className="ml-1 inline-block">
              <IconGitHub size={14} />
            </span>
          </Link>

          <div className="mt-3 flex items-stretch gap-2 h-[26px]">
            {props.vercel_deploy_url && (
              <a target="_blank" href={props.vercel_deploy_url}>
                <Image src="https://vercel.com/button" alt="vercel button" width={75} height={26} />
              </a>
            )}
            {props.demo_url && (
              <Button asChild size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                <Link href={props.demo_url} as={props.demo_url} target="_blank" tabIndex={-1}>
                  Launch Demo
                </Link>
              </Button>
            )}
            {!props.demo_url && (
              <Button asChild size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                <Link href={props.repo_url} as={props.repo_url} target="_blank" tabIndex={-1}>
                  View Code
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ExampleCard
