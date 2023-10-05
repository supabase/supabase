import { Button, IconArrowUpRight } from 'ui'
import Link from 'next/link'
import Image from 'next/image'

function ExampleCard(props: any) {
  return (
    <div className="relative rounded-xl bg-scale-400 from-scale-800 to-scale-800 p-px transition-all shadow-md h-full">
      <div className="relative h-full z-10 rounded-xl bg-scale-200 dark:bg-scale-300 overflow-hidden transition-all text-scale-1100 flex flex-col p-5">
        <div className="mb-4 lg:mb-8 flex-1">
          <h2 className="text text-lg font-medium">{props.title}</h2>
          <div className="my-2 block">
            <p className="text-light">{props.description}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Link href={props.repo_url}>
            <a target="_blank" tabIndex={-1}>
              <Button size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                View Code
              </Button>
            </a>
          </Link>
          {props.demo_url && (
            <Link href={props.demo_url}>
              <a target="_blank" tabIndex={-1}>
                <Button size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                  Launch Demo
                </Button>
              </a>
            </Link>
          )}
          {props.vercel_deploy_url && (
            <Link href={props.vercel_deploy_url}>
              <a target="_blank">
                <Image src="https://vercel.com/button" alt="vercel button" width={75} height={26} />
              </a>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExampleCard
