import classNames from 'classnames'

interface Props {
  children: React.ReactNode
  className?: string
  id?: string
}

const SectionContainer = ({ children, className, id }: Props) => (
  <section
    id={id}
    className={classNames(
      `sm:py-18 container relative mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20`,
      className
    )}
  >
    {children}
  </section>
)

export default SectionContainer
