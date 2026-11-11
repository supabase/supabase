import { ChevronLeftIcon } from 'lucide-react'
import { Button } from 'ui'

/** Leads a row's heading in the details sidebar, back to the details of the table it's in. */
export const RowDetailsBackButton = ({
  relationName,
  onClick,
}: {
  relationName: string
  onClick: () => void
}) => (
  <Button
    variant="text"
    size="tiny"
    className="-ml-1.5 w-6 shrink-0 px-0 text-foreground-lighter hover:text-foreground"
    icon={<ChevronLeftIcon size={16} strokeWidth={1.5} />}
    aria-label={`Back to ${relationName}`}
    onClick={onClick}
  />
)
