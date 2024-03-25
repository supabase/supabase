export interface SectionHeaderProps {
  title: string
  description: string
}

const SectionHeader = ({ title, description }: SectionHeaderProps) => {
  return (
    <div className="mx-auto flex flex-col gap-10 py-14">
      <div>
        <p className="text-xl">{title}</p>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
    </div>
  )
}

export default SectionHeader
