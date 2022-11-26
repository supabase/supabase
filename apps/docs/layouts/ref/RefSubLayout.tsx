import { useInView } from 'react-intersection-observer'
import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

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
        <div className={['flex flex-col mx-auto', 'max-w-7xl'].join(' ')}>{props.children}</div>
      </div>
    </div>
  )
}

const Section: FC<ISectionContainer> = ({ id, title, monoFont, children }) => {
  return (
    <article key={id} id={id} className="scroll-mt-24">
      <StickyHeader id={id} title={title} monoFont={monoFont} />
      <div className="grid lg:grid-cols-2 ref-container gap-16">{children}</div>
    </article>
  )
}

const StickyHeader: FC<StickyHeader> = ({ id, title, monoFont }) => {
  const router = useRouter()

  const { ref } = useInView({
    threshold: 1,
    rootMargin: '-20% 0% -35% 0px',
    onChange: (inView, entry) => {
      //if (inView) router.push(entry.target.id, undefined, { shallow: true })
    },
  })

  return (
    <h2
      ref={ref}
      className={[
        'text-xl font-medium text-scale-1200 mb-12 max-w-xl',
        monoFont && 'font-mono',
      ].join(' ')}
    >
      {title}
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
