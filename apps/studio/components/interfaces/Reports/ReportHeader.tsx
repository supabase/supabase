import DatabaseSelector from 'components/ui/DatabaseSelector'

interface ReportHeaderProps {
  title: string
  showDatabaseSelector?: boolean
}

const ReportHeader = ({ title, showDatabaseSelector }: ReportHeaderProps) => (
  <div className="flex flex-row justify-between gap-4 items-center">
    <h1 className="text-2xl text-foreground">{title}</h1>
    {showDatabaseSelector && <DatabaseSelector />}
  </div>
)
export default ReportHeader
