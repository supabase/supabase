import { useInView } from 'react-intersection-observer'
import { FC } from 'react'

interface ISectionContainer extends FC {
  id: string
  title?: string
  monoFont?: boolean
}

type RefSubLayoutSubComponents = {
  Section: ISectionContainer
  Details: ISectionDetails
  Examples: ISectionExamples
}

type StickyHeader = {
  id: string
  title: string
  monoFont: boolean
}

type RefSubLayoutType = {}

const RefSubLayout: FC<RefSubLayoutType> & RefSubLayoutSubComponents = (props) => {
  return (
    <div className="flex my-16">
      <div className="w-full">
        <div className={['grid gap-24 mx-auto', 'max-w-7xl'].join(' ')}>{props.children}</div>
      </div>
    </div>
  )
}

const Section: FC<ISectionContainer> = ({ id, title, monoFont, children }) => {
  return (
    <article key={id} className="scroll-mt-24">
      <StickyHeader id={id} title={title} monoFont={monoFont} />
      <div className="grid lg:grid-cols-2 ref-container gap-16">{children}</div>
    </article>
  )
}

const StickyHeader: FC<StickyHeader> = ({ id, title, monoFont }) => {
  const { ref } = useInView({
    threshold: 1,
    rootMargin: '30% 0% -35% 0px',
    onChange: (inView, entry) => {
      if (inView && window) window.history.pushState(null, '', entry.target.id)
    },
  })

  return (
    <h2
      ref={ref}
      id={id}
      className={['text-xl font-medium text-scale-1200 mb-8 ', monoFont && 'font-mono'].join(' ')}
    >
      <span className="max-w-xl">{title}</span>
    </h2>
  )
}

interface ISectionDetails extends FC {}

const Details: FC<ISectionDetails> = (props: any) => {
  return <div className="">{props.children}</div>
}

interface ISectionExamples extends FC {}

const Examples: FC<ISectionExamples> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

// @ts-ignore // needs typing with FC type
RefSubLayout.Section = Section
RefSubLayout.Details = Details
RefSubLayout.Examples = Examples
export default RefSubLayout
