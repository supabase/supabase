import { cn } from 'ui'

export interface SectionHeaderProps {
  title: string
  description: string
  className?: string
}

const SectionHeader = ({ title, description, className }: SectionHeaderProps) => {
  return (
    <div className={cn('mx-auto flex flex-col gap-10 py-14', className)}>
      <div>
        <p className="text-xl">{title}</p>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
    </div>
  )
}

export default SectionHeader
