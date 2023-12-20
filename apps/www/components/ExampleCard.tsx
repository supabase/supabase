import { Button, IconArrowUpRight } from 'ui'
import Link from 'next/link'
import Panel from './Panel'

function ExampleCard(props: any) {
  return (
    <Panel innerClassName="bg-surface-100">
      <div className="p-5 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-foreground text-lg">{props.title} </h4>
          </div>
          {props.showProducts && (
            <div className="inline-flex gap-2">
              {props.products.map((product: string) => (
                <span className="!px-1 py-0.5 bg-surface-300 !rounded border text-xs text-lighter">
                  {product}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-foreground-muted">{props.description}</p>
        </div>
      </div>
      <div>
        <div className="flex flex-col justify-between p-5 pt-0">
          <div className="pt-5 border-t flex items-stretch gap-2">
            {props.repo_url && (
              <Button
                asChild
                size="tiny"
                type="default"
                className="group overflow-hidden"
                iconRight={
                  <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                    <IconArrowUpRight className="absolute inset-0 transition-transform duration-200 translate-x-0 translate-y-0 group-hover:translate-x-6 group-hover:-translate-y-6" />
                    <IconArrowUpRight className="absolute inset-0 transition-transform duration-200 -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:-translate-y-0" />
                  </div>
                }
              >
                <Link href={props.repo_url} as={props.repo_url} target="_blank">
                  View Template
                </Link>
              </Button>
            )}
            {props.demo_url && (
              <Button
                asChild
                size="tiny"
                type="text"
                className="group overflow-hidden"
                iconRight={
                  <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                    <IconArrowUpRight className="absolute inset-0 transition-transform duration-200 translate-x-0 translate-y-0 group-hover:translate-x-6 group-hover:-translate-y-6" />
                    <IconArrowUpRight className="absolute inset-0 transition-transform duration-200 -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:-translate-y-0" />
                  </div>
                }
              >
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
