import { useInView } from 'react-intersection-observer'
import { FC } from 'react'
import { highlightSelectedNavItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'

interface ISectionContainer {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
}

type RefSubLayoutSubComponents = {
  Section: FC<ISectionContainer>
  Details: FC<ISectionDetails>
  Examples: FC<ISectionExamples>
}

type StickyHeader = {
  id: string
  title?: string
  monoFont?: boolean
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

const Section: FC<ISectionContainer> = (props) => {
  return (
    <article key={props.id}>
      <StickyHeader id={props.slug} title={props.title} monoFont={props.monoFont} />
      <div className="grid lg:grid-cols-2 ref-container gap-16">{props.children}</div>
    </article>
  )
}

const StickyHeader: FC<StickyHeader> = (props) => {
  const { ref } = useInView({
    threshold: 1,
    rootMargin: '30% 0% -35% 0px',
    onChange: (inView, entry) => {
      if (inView && window) {
        window.history.pushState(null, '', entry.target.id)
        highlightSelectedNavItem(entry.target.id)
      }
    },
  })

  return (
    <h2
      ref={ref}
      id={props.id}
      className={[
        'text-xl font-medium text-scale-1200 mb-8 scroll-mt-24',
        props.monoFont && 'font-mono',
      ].join(' ')}
    >
      {props.title && <span className="max-w-xl">{props.title}</span>}
    </h2>
  )
}

interface ISectionDetails {}

const Details: FC<ISectionDetails> = (props) => {
  return <div>{props.children}</div>
}

interface ISectionExamples {}

const Examples: FC<ISectionExamples> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

RefSubLayout.Section = Section
RefSubLayout.Details = Details
RefSubLayout.Examples = Examples
export default RefSubLayout
