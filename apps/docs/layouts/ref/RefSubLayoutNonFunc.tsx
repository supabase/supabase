import { FC, MutableRefObject, PropsWithChildren } from 'react'

import { useObserveIntersection } from '~/components/reference/RefSectionHandler'

interface ISectionContainer {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
  scrollSpyHeader?: boolean
  singleColumn?: boolean
}

type RefSubLayoutNonFuncSubComponents = {
  Section: FC<ISectionContainer>
  Details: FC<ISectionDetails>
  Examples: FC<ISectionExamples>
}

type StickyHeader = {
  id: string
  slug?: string
  title?: string
  monoFont?: boolean
  scrollSpyHeader?: boolean // whether or not the header updates the url on scroll
}

type RefSubLayoutNonFuncType = {}

const RefSubLayoutNonFunc: FC<PropsWithChildren<RefSubLayoutNonFuncType>> &
  RefSubLayoutNonFuncSubComponents = (props) => {
  return <div className="flex flex-col w-full divide-y">{props.children}</div>
}

const Section: FC<PropsWithChildren<ISectionContainer>> = (props) => {
  return (
    <article
      key={props.id}
      className={`${props.singleColumn ? 'prose py-16 lg:py-32 ' : 'py-16 lg:py-32'}`}
    >
      <StickyHeader {...props} />
      <div
        className={`ref-container gap-16 ${
          !props.singleColumn ? 'grid lg:grid-cols-2' : 'ref-container--full-width lg:max-w-3xl'
        }`}
      >
        {props.children}
      </div>
    </article>
  )
}

const StickyHeader: FC<StickyHeader> = (props) => {
  const { ref } = useObserveIntersection()

  return (
    <h2
      ref={ref as MutableRefObject<HTMLHeadingElement>}
      id={props.slug}
      className={[
        'text-xl font-medium text-foreground mb-8 scroll-mt-24',
        props.monoFont && 'font-mono',
      ].join(' ')}
    >
      {props.title && <span className="max-w-xl">{props.title}</span>}
    </h2>
  )
}

interface ISectionDetails {}

const Details: FC<PropsWithChildren<ISectionDetails>> = (props) => {
  return <div>{props.children}</div>
}

interface ISectionExamples {}

const Examples: FC<PropsWithChildren<ISectionExamples>> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

RefSubLayoutNonFunc.Section = Section
RefSubLayoutNonFunc.Details = Details
RefSubLayoutNonFunc.Examples = Examples
export default RefSubLayoutNonFunc
