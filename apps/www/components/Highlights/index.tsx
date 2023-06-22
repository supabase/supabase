import SectionContainer from '../Layouts/SectionContainer'
import InteractiveShimmerCard from '../Panel'
import { ReactNode } from 'react'

interface Props {
  highlights: {
    title: string | ReactNode
    className?: string
    children: ReactNode
  }[]
}

const Highlights = (props: Props) => {
  const Panels = props.highlights?.map((highlight: any) => {
    const { title, className, children } = highlight

    return (
      <InteractiveShimmerCard outerClassName={['min-h-[200px]', className].join(' ')} key={title}>
        {children}
      </InteractiveShimmerCard>
    )
  })

  return (
    <SectionContainer className="space-y-16 max-w-7xl pb-0">
      <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-2 md:gap-8 xl:grid-cols-3 lg:gap-x-8">
        {Panels}
      </dl>
    </SectionContainer>
  )
}

export default Highlights
