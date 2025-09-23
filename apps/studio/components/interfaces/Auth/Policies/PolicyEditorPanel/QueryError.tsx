import { initial, last } from 'lodash'
import { Dispatch, SetStateAction } from 'react'

import styles from '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import { QueryResponseError } from 'data/sql/execute-sql-mutation'
import {
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'

export const QueryError = ({
  error,
  open,
  setOpen,
}: {
  error: QueryResponseError
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) => {
  const formattedError =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  return (
    <div className="flex flex-col gap-y-3 px-5">
      <Alert_Shadcn_ variant="destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
        <div className="flex flex-col gap-3">
          <AlertTitle_Shadcn_ className="m-0">Error running SQL query</AlertTitle_Shadcn_>

          <Collapsible_Shadcn_
            defaultOpen
            className="flex flex-col gap-3"
            open={open}
            onOpenChange={() => setOpen(!open)}
          >
            <div className="flex gap-2">
              <CollapsibleTrigger_Shadcn_ asChild>
                <Button
                  size="tiny"
                  type="outline"
                  className={cn('group', styles['ai-icon__container--allow-hover-effect'])}
                >
                  {open ? 'Hide error details' : 'Show error details'}
                </Button>
              </CollapsibleTrigger_Shadcn_>
            </div>
            <CollapsibleContent_Shadcn_ className="overflow-auto">
              {formattedError.length > 0 ? (
                formattedError.map((x: string, i: number) => (
                  <pre key={`error-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                    {x
                      .split(' ')
                      .reduce((arr, cur) => {
                        // Split the ERROR string so that it can be wrapped in a red span
                        const l = last(arr)

                        if (l && l !== 'ERROR:') {
                          return initial(arr).concat([[l, cur].join(' ')])
                        }

                        if (l === '') {
                          return arr.concat([' '])
                        }

                        return arr.concat([cur])
                      }, [] as string[])
                      .map((str, index, arr) => {
                        return (
                          <span
                            key={index}
                            className={cn('break-all', str === 'ERROR:' && 'text-destructive')}
                          >
                            {str}
                          </span>
                        )
                      })}
                  </pre>
                ))
              ) : (
                <p className="font-mono text-xs">{error.error}</p>
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        </div>
      </Alert_Shadcn_>
      <div className="overflow-x-auto"></div>
    </div>
  )
}
