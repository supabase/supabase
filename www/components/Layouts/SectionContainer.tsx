interface Props {
  children: React.ReactNode
  className?: string
}

const SectionContainer = ({ children, className }: Props) => (
  <div className={`container mx-auto px-8 sm:px-16 xl:px-20 relative py-32 ${className}`}>
    {children}
  </div>
)

export default SectionContainer
