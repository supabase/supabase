import { type PropsWithChildren } from 'react'
import Link from 'next/link'
import {
  Badge,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import { type AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { ChevronDown } from 'lucide-react'

interface ReferenceNavigationProps {
  name: string
  icon: string
  library: string
  version: string
  versions: string[]
  isLatestVersion: boolean
  sections: AbbrevApiReferenceSection[]
}

export async function ReferenceNavigation({
  name,
  icon,
  library,
  version,
  versions,
  isLatestVersion,
  sections,
}: ReferenceNavigationProps) {
  const basePath = `/reference/${library}${isLatestVersion ? '' : `/${version}`}`

  return (
    <div className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        {icon && <MenuIconPicker icon={icon} width={21} height={21} />}
        <span className="text-base text-brand-600">{name}</span>
        <ReferenceVersionDropdown library={library} currentVersion={version} versions={versions} />
      </div>
      <ul className="flex flex-col gap-2">
        {sections?.map((section, index) =>
          section.type === 'category' ? (
            <li key={`${section.slug}-${String(index)}`}>
              <RefCategory basePath={basePath} section={section} />
            </li>
          ) : (
            <li key={section.slug} className="leading-5">
              <ReferenceLink section={section} />
            </li>
          )
        )}
      </ul>
    </div>
  )
}

function ReferenceLink({ section }: { section: AbbrevApiReferenceSection }) {
  if (!('title' in section) || !section.slug) return null
  return (
    <a
      href={`#${section.slug}`}
      className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
    >
      {section.title}
    </a>
  )
}

function RefCategory({
  basePath,
  section,
}: {
  basePath: string
  section: AbbrevApiReferenceSection
}) {
  if (!('items' in section && section.items && section.items.length > 0)) return null

  return (
    <>
      <Divider />
      {'title' in section && section.slug ? (
        <a href={`${basePath}#${section.slug}`}>
          <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>
        </a>
      ) : (
        'title' in section && <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>
      )}
      <ul className="space-y-2">
        {section.items?.map((item, index) => (
          <li key={`${item.slug}-${String(index)}`} className="leading-5">
            <ReferenceLink section={item} />
          </li>
        ))}
      </ul>
    </>
  )
}

function Divider() {
  return <hr className="w-full h-px my-3 bg-control" />
}

function SideMenuTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'font-mono font-medium text-xs text-foreground tracking-wider uppercase',
        className
      )}
    >
      {children}
    </div>
  )
}

const ReferenceVersionDropdown = ({
  library,
  currentVersion,
  versions,
}: {
  library: string
  currentVersion: string
  versions: string[]
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          className="
          group
          justify-between
          bg-control
          border
          hover:border-control
          hover:bg-overlay-hover
          border-control px-2 h-[32px] rounded
          font-mono
          flex items-center gap-1 text-foreground-muted text-xs group-hover:text-foreground transition
          "
        >
          <span className="text-foreground text-sm group-hover:text-foreground transition">
            {currentVersion}.0
          </span>
          <ChevronDown size={14} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-48">
        <DropdownMenuLabel className="text-xs">Stable releases</DropdownMenuLabel>
        {versions.map((version, index) => (
          <DropdownMenuItem key={version}>
            <Link
              className="w-full justify-between items-center flex"
              href={
                version === versions[0]
                  ? `/reference/${library}/`
                  : `/reference/${library}/${version}`
              }
            >
              <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
                Version {version}.0
              </span>
              {index === 0 && <Badge>Latest</Badge>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
