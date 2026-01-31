import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { InlineLinkClassName } from './InlineLink'
import { ResponseError } from '@/types'

type CostMetadata = {
  cost: number
  sql: string
}

interface HighQueryCostErrorProps {
  error: ResponseError
  suggestions?: string[]
}

export const HighCostError = ({ error, suggestions }: HighQueryCostErrorProps) => {
  // [Joshen] The CTA could be to use a read replica to query or something?
  return (
    <Admonition
      type="default"
      title="Data not loaded to protect database performance"
      description="The query to retrieve the data was not run as it could place heavy load on the database and impact performance"
    >
      <HighQueryCostDialog error={error} suggestions={suggestions} />
    </Admonition>
  )
}

const HighQueryCostDialog = ({ error, suggestions = [] }: HighQueryCostErrorProps) => {
  const metadata = error.metadata as CostMetadata

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default" className="mt-2">
          Learn more
        </Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Estimated query cost exceeds safety thresholds</DialogTitle>
          <DialogDescription>
            Preventive measure to mitigate impacting the database
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 text-sm">
          <p>
            The dashboard runs optimized SQL queries on your project’s database to load data for
            this interface.
          </p>
          <p>
            However, the query was skipped as its{' '}
            <Tooltip>
              <TooltipTrigger className={InlineLinkClassName}>estimated cost</TooltipTrigger>
              <TooltipContent side="bottom" className="flex flex-col gap-y-1">
                <p>Estimated cost: {metadata.cost.toLocaleString()}</p>
                <p className="text-foreground-light">
                  Determined via the <code className="text-code-inline">EXPLAIN</code> command
                </p>
              </TooltipContent>
            </Tooltip>{' '}
            is high and could place significant load on the database.
          </p>
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-y-1">
              <p>You may check the following to ensure that the query cost is lower</p>
              <ul className="list-disc pl-6">
                {suggestions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogSection>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="default" className="opacity-100">
              Understood
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
