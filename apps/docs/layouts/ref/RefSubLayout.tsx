import { useInView } from 'react-intersection-observer'
import { FC } from 'react'
import { highlightSelectedNavItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'
import { useRouter } from 'next/router'
import { useNavigationMenuContext } from '~/components/Navigation/NavigationMenu/NavigationMenu.Context'
import { route } from 'next/dist/server/router'
import { menuState } from '~/hooks/useMenuState'

interface ISectionContainer {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
  scrollSpyHeader?: boolean
  singleColumn?: boolean
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
}

type RefSubLayoutType = {}

interface IEducationRow {}
interface IEducationSection {
  id: string
  title?: string
  monoFont?: boolean
  slug: string
  scrollSpyHeader?: boolean
  hideTitle?: boolean
}
interface ISectionDetails {}
interface ISectionExamples {}

const RefSubLayout: FC<RefSubLayoutType> & RefSubLayoutSubComponents = (props) => {
  return <div className="flex flex-col w-full divide-y">{props.children}</div>
}

const Section: FC<ISectionContainer> = (props) => {
  // console.log({ props })
  return (
    <article
      key={props.id}
      className={`${
        props.singleColumn ? 'prose dark:prose-dark py-16 lg:py-32 ' : 'py-16 lg:py-32'
      }`}
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
  const router = useRouter()
  const { setActiveRefItem } = useNavigationMenuContext()

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
    <h2
      ref={ref}
      id={props.slug}
      data-ref-id={props.id}
      className={[
        'text-2xl font-medium text-scale-1200 mb-8 scroll-mt-24',
        props.monoFont && 'font-mono',
      ].join(' ')}
    >
      {props.title && <span className="max-w-xl">{props.title}</span>}
    </h2>
  )
}

const Details: FC<ISectionDetails> = (props) => {
  return <div>{props.children}</div>
}

const Examples: FC<ISectionExamples> = (props) => {
  return (
    <div className="w-full">
      <div className="sticky top-24">{props.children}</div>
    </div>
  )
}

const EducationRow: FC<IEducationRow> = (props) => {
  return <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">{props.children}</div>
}

const EducationSection: FC<IEducationSection> = ({ hideTitle = false, ...props }) => {
  // console.log({ props })
  return (
    <article key={props.id} className={`${'prose dark:prose-dark max-w-none py-16 lg:py-32'}`}>
      {!hideTitle && <StickyHeader {...props} />}
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
