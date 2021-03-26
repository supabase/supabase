interface Props {
  children: React.ReactNode
  className?: string
}

const SectionContainer = ({ children, className }: Props) => (
  <div
    className={`container mx-auto px-6 lg:px-16 xl:px-20 relative py-16 sm:py-18 md:py-24 lg:py-24 ${className}`}
  >
    {children}
  </div>
)

export default SectionContainer
