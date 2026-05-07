import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { type DocsSearchResult as Page, type DocsSearchResultSection as PageSection } from 'common'
import { cn } from 'ui'
import { TextHighlighterBase as TextHighlighter } from 'ui-patterns/CommandMenu'
import { formatSectionUrl, generateLink, getPageIcon } from './SupportForm.utils'

const cardBaseClasses =
  'bg-200 rounded-lg hover:bg-surface-200 p-3 transition-colors hover:border-overlay hover:shadow-sm flex items-center justify-between'

interface DocsLinkGroup {
  page: Page
}

export const DocsLinkGroup = ({ page }: DocsLinkGroup) => {
  const link = generateLink(page.type, page.path)

  return (
    <ul key={page.id} className="grid gap-2">
      <li key={`${page.path}-group`} className="px-2">
        <Link
          target="_blank"
          rel="noreferrer"
          href={link}
          className={cn(cardBaseClasses, 'flex items-center justify-between pr-5')}
        >
          <div className="grow flex gap-3 items-center">
            <div>{getPageIcon(page)}</div>
            <div className="flex flex-col gap-0 pr-6">
              <span className="text-sm">
                <TextHighlighter text={page.title} query="test" />
              </span>
              {(page.description || page.subtitle) && (
                <div className="text-xs text">
                  <TextHighlighter text={page.description || page.subtitle || ''} query="test" />
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={18} />
        </Link>
        {page.sections.length > 0 && (
          <ul className="border-l border-default ml-3 pt-3 grid gap-2">
            {page.sections.map((section: PageSection, i) => (
              <DocsLinkSection
                key={`${page.path}__${section.heading}-item-${i}`}
                page={page}
                section={section}
              />
            ))}
          </ul>
        )}
      </li>
    </ul>
  )
}

interface DocsLinkSection {
  page: Page
  section: PageSection
}

const DocsLinkSection = ({ page, section }: DocsLinkSection) => {
  const sectionLink = formatSectionUrl(page, section)

  return (
    <ul key={`${section.heading}-group`} className="grid gap-2">
      <li key={`${section.heading}-item`} className="p-2 mb-2">
        <Link target="_blank" href={sectionLink} className={cn(cardBaseClasses)}>
          <div className="grow flex gap-3 items-center">
            <div>{getPageIcon(page)}</div>
            <div className="grid gap-1.5">
              {page.type !== 'github-discussions' && (
                <span>
                  <TextHighlighter
                    className="not-italic text-xs rounded-full px-3 py-1 bg-surface-300 "
                    text={section.heading}
                    query="test"
                  />
                </span>
              )}

              {section.heading && (
                <div className="text text-xs ">
                  <TextHighlighter text={section.heading} query="test" />
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={18} />
        </Link>
      </li>
    </ul>
  )
}
