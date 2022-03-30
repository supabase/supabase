import { IconAlertCircle } from '@supabase/ui'

const WarningBanner = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="bg-yellow-900 px-6 py-4">
      <div className="flex gap-3">
        <div className="mt-1 text-yellow-1100 dark:text-yellow-800">
          <IconAlertCircle size={14} strokeWidth={2} />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
          <h1 className="text-base text-scale-1200 dark:text-scale-100">{title}</h1>
          <p className="text-sm text-yellow-1100 dark:text-yellow-800">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default WarningBanner
