import { useInView } from 'react-intersection-observer'
import { FC } from 'react'
import { highlightSelectedNavItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'
import { useRouter } from 'next/router'
import { useNavigationMenuContext } from '~/components/Navigation/NavigationMenu/NavigationMenu.Context'
import { menuState } from '~/hooks/useMenuState'
import Image from 'next/image'

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
  Section: FC<ISectionContainer>
  EducationSection: FC<IEducationSection>
  EducationRow: FC<IEducationRow>
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

const RefSubLayout: FC<RefSubLayoutType> & RefSubLayoutSubComponents = (props) => {
  return <div className="flex flex-col w-full divide-y">{props.children}</div>
}

const Section: FC<ISectionContainer> = (props) => {
  return (
    <article
      key={props.id + 'section'}
      className={[
        props.singleColumn ? 'prose dark:prose-dark w-full' : 'w-full',
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

  const { setActiveRefItem } = useNavigationMenuContext()

  // we're serving search bots a different file (/crawlers/[...slug])
  // and need to modify content to suit that
  const isCrawlerPage = router.route.includes('/crawlers/[...slug]')

  const { ref } = useInView({
    threshold: 1,
    rootMargin: '30% 0% -35% 0px',
    onChange: (inView, entry) => {
      if (inView && window) highlightSelectedNavItem(entry.target.attributes['data-ref-id'].value)
      if (inView && props.scrollSpyHeader) {
        window.history.replaceState(null, '', entry.target.id)
        // if (setActiveRefItem) setActiveRefItem(entry.target.attributes['data-ref-id'].value)
        menuState.setMenuActiveRefId(entry.target.attributes['data-ref-id'].value)
        // router.push(`/reference/javascript/${entry.target.attributes['data-ref-id'].value}`, null, {
        //   shallow: true,
        // })
      }
    },
  })

  return (
    <div className={['flex items-center gap-3 not-prose', icon && 'mb-8'].join(' ')}>
      {icon && (
        <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center">
          <Image width={16} height={16} alt={icon} src={`${icon}.svg`} />
        </div>
      )}
      {isCrawlerPage ? (
        <h1>{props.title}</h1>
      ) : (
        <h2
          ref={ref}
          id={props.slug}
          data-ref-id={props.id}
          className={[
            'text-2xl font-medium text-scale-1200 scroll-mt-24',
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

const Details: FC<ISectionDetails> = (props) => {
  return <div className="relative overflow-hidden w-full">{props.children}</div>
}

const Examples: FC<ISectionExamples> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

const EducationRow: FC<IEducationRow> = (props) => {
  return (
    <div className={['grid lg:grid-cols-2 gap-8 lg:gap-16', props.className].join(' ')}>
      {props.children}
    </div>
  )
}

const EducationSection: FC<IEducationSection> = ({ icon, hideTitle = false, ...props }) => {
  return (
    <article
      key={props.id + 'education'}
      className={'prose dark:prose-dark max-w-none py-16 lg:py-32 first:pt-8 last:pb-8'}
    >
      {!hideTitle && <StickyHeader {...props} icon={icon} />}
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
