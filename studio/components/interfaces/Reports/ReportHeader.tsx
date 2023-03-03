import { Button, IconRefreshCw } from 'ui'

interface Props {
  title: string
  onRefresh: () => void
  isLoading: boolean
}

const ReportHeader: React.FC<Props> = ({ title, onRefresh, isLoading }) => (
  <div className="flex flex-row justify-between gap-4 items-center">
    <h1 className="text-2xl text-scale-1200">{title}</h1>
    <Button
      type="default"
      size="tiny"
      onClick={onRefresh}
      disabled={isLoading ? true : false}
      icon={
        <IconRefreshCw
          size="tiny"
          className={`text-scale-1100 ${isLoading ? 'animate-spin' : ''}`}
        />
      }
    >
      {isLoading ? 'Refreshing' : 'Refresh'}
    </Button>
  </div>
)
export default ReportHeader
