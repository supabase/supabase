import { FC, MutableRefObject, PropsWithChildren } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/legacy/image'
import { useObserveIntersection } from '~/components/reference/RefSectionHandler'

interface ISectionContainer {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
  scrollSpyHeader?: boolean
  singleColumn?: boolean
  icon?: string
}

type RefSubLayoutSubComponents = {
  Section: FC<PropsWithChildren<ISectionContainer>>
  EducationSection: FC<PropsWithChildren<IEducationSection>>
  EducationRow: FC<PropsWithChildren<IEducationRow>>
  Details: FC<ISectionDetails>
  Examples: FC<ISectionExamples>
}

type StickyHeader = {
  id: string
  slug?: string
  title?: string
  monoFont?: boolean
  scrollSpyHeader?: boolean // whether or not the header updates the url on scroll
  icon?: string
}

type RefSubLayoutType = {}

interface IEducationRow {
  className?: string
}
interface IEducationSection {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
  scrollSpyHeader?: boolean
  hideTitle?: boolean
  icon?: string
}
interface ISectionDetails {}
interface ISectionExamples {}

const RefSubLayout: FC<PropsWithChildren<RefSubLayoutType>> & RefSubLayoutSubComponents = (
  props
) => {
  return (
    <div className="flex flex-col w-full divide-y px-5 max-w-7xl mx-auto py-16">
      {props.children}
    </div>
  )
}

const Section: FC<PropsWithChildren<ISectionContainer>> = (props) => {
  return (
    <article
      key={props.id + 'section'}
      className={[
        props.singleColumn ? 'prose w-full' : 'w-full',
        'py-16 lg:py-32 first:pt-8 last:pb-8',
      ].join(' ')}
    >
      <StickyHeader {...props} />
      <div
        className={`ref-container w-full gap-16 ${
          !props.singleColumn ? 'grid lg:grid-cols-2' : 'ref-container--full-width lg:max-w-3xl'
        }`}
      >
        {props.children}
      </div>
    </article>
  )
}

const StickyHeader: FC<StickyHeader> = ({ icon, ...props }) => {
  const router = useRouter()

  // we're serving search bots a different file (/crawlers/[...slug])
  // and need to modify content to suit that
  const isCrawlerPage = router.route.includes('/crawlers/[...slug]')

  const { ref } = useObserveIntersection()

  return (
    <div className={['flex items-center gap-3 not-prose', icon && 'mb-8'].join(' ')}>
      {icon && (
        <div className="w-8 h-8 bg-brand-300 rounded flex items-center justify-center">
          <Image width={16} height={16} alt={icon} src={`${icon}.svg`} />
        </div>
      )}
      {isCrawlerPage ? (
        <h1>{props.title}</h1>
      ) : (
        <h2
          ref={ref as MutableRefObject<HTMLHeadingElement>}
          id={props.slug}
          data-ref-id={props.id}
          className={[
            'text-2xl font-medium text-foreground scroll-mt-24',
            !icon && 'mb-8',
            props.monoFont && 'font-mono',
          ].join(' ')}
        >
          {props.title && <span className="max-w-xl">{props.title}</span>}
        </h2>
      )}
    </div>
  )
}

const Details: FC<PropsWithChildren<ISectionDetails>> = (props) => {
  return <div className="relative w-full">{props.children}</div>
}

const Examples: FC<PropsWithChildren<ISectionExamples>> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

const EducationRow: FC<PropsWithChildren<IEducationRow>> = (props) => {
  return (
    <div className={['grid lg:grid-cols-2 gap-8 lg:gap-16', props.className].join(' ')}>
      {props.children}
    </div>
  )
}

/**
 * Highlight heading in nav bar even if not displayed
 */
const HiddenTitle = ({ slug, title }: { slug: string; title: string }) => {
  const { ref } = useObserveIntersection()
  return (
    <h2 id={slug} className="sr-only" ref={ref as MutableRefObject<HTMLHeadingElement>}>
      {title}
    </h2>
  )
}

const EducationSection: FC<PropsWithChildren<IEducationSection>> = ({
  icon,
  hideTitle = false,
  ...props
}) => {
  return (
    <article
      key={props.id + 'education'}
      className={'prose max-w-none py-16 lg:py-32 first:pt-8 last:pb-8'}
      {...props}
    >
      {hideTitle ? (
        <HiddenTitle slug={props.slug} title={props.title} />
      ) : (
        <StickyHeader {...props} icon={icon} />
      )}
      {props.children}
    </article>
  )
}

// function based layout
RefSubLayout.Section = Section
// education based layout
RefSubLayout.EducationSection = EducationSection
RefSubLayout.EducationRow = EducationRow
// common columns
RefSubLayout.Details = Details
RefSubLayout.Examples = Examples
export default RefSubLayout
