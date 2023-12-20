import { Button, IconArrowUpRight } from 'ui'
import Link from 'next/link'
import Panel from './Panel'
import { products } from 'shared-data'
import type { PRODUCT } from 'shared-data/products'
import ReactTooltip from 'react-tooltip'

function ExampleCard(props: any) {
  return (
    <>
      <Panel innerClassName="bg-surface-100 group/panel">
        <div className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h4 className="text-foreground text-lg">{props.title} </h4>
              {props.showProducts && (
                <div className="inline-flex gap-1.5">
                  {props.products.map((product: string) => (
                    <div
                      data-tip={product}
                      className="opacity-100 lg:opacity-0 group-hover/panel:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center bg-surface-300 rounded border border-control text-xs text-lighter"
                      title={product}
                    >
                      {/* {product} */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d={products[product.toLowerCase() as PRODUCT].icon[16]}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
      {props.showProducts && (
        <ReactTooltip
          effect="solid"
          backgroundColor="hsl(var(--background-alternative-default))"
          textColor="hsl(var(--foreground-light))"
          className="bg-alternative !py-1 !px-2"
          offset={{ top: 4 }}
          disableInternalStyle
        />
      )}
    </>
  )
}

export default ExampleCard
