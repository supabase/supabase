export interface SectionHeaderProps {
  title: string
  description: string
}

const SectionHeader = ({ title, description }: SectionHeaderProps) => {
  return (
    <div className="border-b">
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <div>
          <p className="text-xl">{title}</p>
          <p className="text-sm text-foreground-light">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default SectionHeader
