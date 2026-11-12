import { CopyHeadingLinkButton } from 'ui'

interface ReportSectionHeaderProps {
  id: string
  title: string
  description: string
}

export const ReportSectionHeader = ({ id, title, description }: ReportSectionHeaderProps) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground text-lg font-medium">{title}</h3>
        <CopyHeadingLinkButton id={id} />
      </div>
      <p className="text-foreground-light text-sm">{description}</p>
    </div>
  )
}
