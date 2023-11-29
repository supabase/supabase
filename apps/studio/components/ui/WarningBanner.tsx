import { IconAlertCircle } from 'ui'

const WarningBanner = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="rounded bg-warning-200 px-6 py-3">
      <div className="flex flex-row gap-4">
        <div className="mt-1 text-warning">
          <IconAlertCircle size={14} strokeWidth={2} />
        </div>
        <div className="flex flex-col items-start gap-x-3 xl:flex-row xl:items-center">
          <h2 className="text-sm text-foreground">{title}</h2>
          {description && <p className="text-xs text-warning">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default WarningBanner
