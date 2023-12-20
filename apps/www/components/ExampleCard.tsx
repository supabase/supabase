import { Button, IconArrowUpRight } from 'ui'
import Link from 'next/link'
import Panel from './Panel'

function ExampleCard(props: any) {
  return (
    <Panel innerClassName="bg-surface-100" hasShimmer>
      <div className="h-32 p-5 flex flex-col justify-between ">
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-foreground text-lg">{props.title} </h4>
          </div>
          <div className="inline-flex gap-1">
            {props.products.map((product: string) => (
              <span className="!px-1 py-0.5 bg-surface-300 !rounded border text-xs text-lighter">
                {product}
              </span>
            ))}
          </div>
          <p className="text-sm text-foreground-muted mb-2">{props.description}</p>
        </div>
      </div>
      <div>
        <div className="flex flex-col justify-between p-5">
          <div className="mt-3 pt-5 border-t flex items-stretch gap-2">
            {props.repo_url && (
              <Button asChild size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                <Link href={props.repo_url} as={props.repo_url} target="_blank">
                  View Code
                </Link>
              </Button>
            )}
            {props.demo_url && (
              <Button asChild size="tiny" type="default" iconRight={<IconArrowUpRight />}>
                <Link href={props.demo_url} as={props.demo_url} target="_blank">
                  Launch Demo
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default ExampleCard
