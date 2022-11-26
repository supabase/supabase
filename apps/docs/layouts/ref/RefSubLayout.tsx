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

type RefSubLayoutType = {}

const RefSubLayout: FC<RefSubLayoutType> & RefSubLayoutSubComponents = (props) => {
  return (
    <div className="flex my-16">
      <div className="w-full">
        <div
          className={[
            'flex flex-col mx-auto',
            process.env.NEXT_PUBLIC_EXPERIMENTAL_REF === 'true' ? 'max-w-7xl' : 'max-w-5xl',
          ].join(' ')}
        >
          {props.children}
        </div>
      </div>
    </div>
  )
}

const Section: FC<ISectionContainer> = (props) => {
  return (
    <article key={props.id} id={props.id} className="py-16">
      <header className="not-prose mb-12">
        <h2
          className={['text-xl font-medium text-scale-1200', props.monoFont && 'font-mono'].join(
            ' '
          )}
        >
          {props.title}
        </h2>
      </header>
      <div className="grid grid-cols-2 ref-container gap-16">{props.children}</div>
    </article>
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
