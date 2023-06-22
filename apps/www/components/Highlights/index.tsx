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
  const Panels = props.highlights?.map((highlight: any, index: number) => {
    const { outerClassName, innerClassName, children } = highlight

    const compositeOuterClassName = [
      index === 0 ? 'aspect-[5/1]' : 'aspect-[1.08/1]',
      outerClassName,
    ].join(' ')
    const compositeInnerClassName = ['', innerClassName].join(' ')

    return (
      <InteractiveShimmerCard
        outerClassName={compositeOuterClassName}
        innerClassName={compositeInnerClassName}
        key={highlight.title}
      >
        {index !== 0 && (
          <div className="relative z-10 p-8 flex flex-col items-center text-center">
            <h3 className="text-lg text-scale-1200 mb-2">{highlight.title}</h3>
            <p className="text-sm text-scale-900">{highlight.paragraph}</p>
          </div>
        )}
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
