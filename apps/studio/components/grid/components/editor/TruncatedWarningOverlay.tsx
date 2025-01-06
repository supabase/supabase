import { MAX_CHARACTERS } from 'data/table-rows/table-rows-query'
import { Button, cn } from 'ui'

export const TruncatedWarningOverlay = ({
  isLoading,
  loadFullValue,
}: {
  isLoading: boolean
  loadFullValue: () => void
}) => {
  return (
    <div
      className={cn(
        'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
        'text-xs w-full h-full px-3 text-center',
        'bg-default/80 backdrop-blur-[1.5px]'
      )}
    >
      <div className="flex flex-col gap-y-1">
        <p>Value is larger than {MAX_CHARACTERS.toLocaleString()} characters</p>
        <p className="text-foreground-light">
          You may try to render the entire value, but your browser may run into performance issues
        </p>
      </div>
      <Button type="default" loading={isLoading} onClick={loadFullValue}>
        Load full value
      </Button>
    </div>
  )
}
