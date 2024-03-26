import { Button, IconRefreshCw } from 'ui'

interface Props {
  title: string
  onRefresh: () => void
  isLoading: boolean
}

const ReportHeader: React.FC<Props> = ({ title, onRefresh, isLoading }) => (
  <div className="flex flex-row justify-between gap-4 items-center">
    <h1 className="text-2xl text-foreground">{title}</h1>
  </div>
)
export default ReportHeader
