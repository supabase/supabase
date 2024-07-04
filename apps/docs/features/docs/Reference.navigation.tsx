import { isPlainObject } from 'lodash'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { Fragment, type PropsWithChildren } from 'react'
import { parse } from 'yaml'

import { cn } from 'ui'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import { getMenuById, MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { SPEC_DIRECTORY } from '~/lib/docs'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import { REFERENCES } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { RefLink } from './Reference.navigation.client'

interface AbbrevCommonClientLibSection {
  id: string
  type: string
  title?: string
  slug?: string
  items?: Array<AbbrevCommonClientLibSection>
  excludes?: Array<string>
}

async function genClientSdkNav(specFile: string, excludeName: string) {
  const rawSpec = await getSpecCached(specFile)
  const spec = parse(rawSpec) as Json

  const fns = parseFnsList(spec)
  const validSections = deepFilterRec(
    commonClientLibSections as Array<AbbrevCommonClientLibSection>,
    'items',
    (section) =>
      section.type === 'markdown'
        ? !('excludes' in section && section.excludes.includes(excludeName))
        : section.type === 'function'
          ? fns.some(({ id }) => section.id === id)
          : true
  )
  return validSections
}

async function _getSpec(specFile: string, { ext = 'yml' }: { ext?: string } = {}) {
  const specFullPath = join(SPEC_DIRECTORY, `${specFile}.${ext}`)
  const rawSpec = await readFile(specFullPath, 'utf-8')
  return rawSpec
}
const getSpecCached = cache_fullProcess_withDevCacheBust(
  _getSpec,
  SPEC_DIRECTORY,
  (filename: string) => {
    const ext = extname(filename).substring(1)
    return ext === 'yml'
      ? JSON.stringify([basename(filename)])
      : JSON.stringify([basename(filename), { ext }])
  }
)

function parseFnsList(rawSpec: Json): Array<{ id: unknown }> {
  if (isPlainObject(rawSpec) && 'functions' in (rawSpec as object)) {
    const _rawSpec = rawSpec as { functions: unknown }
    if (Array.isArray(_rawSpec.functions)) {
      return _rawSpec.functions.filter(({ id }) => !!id)
    }
  }

  return []
}

interface ClientSdkNavigationProps {
  name: string
  menuId: MenuId
  menuData: { icon?: string }
  libPath: string
  version: string
  specFile: string
  excludeName: string
}

async function ClientSdkNavigation({
  name,
  menuId,
  menuData,
  libPath,
  version,
  specFile,
  excludeName,
}: ClientSdkNavigationProps) {
  const menu = getMenuById(menuId)
  const navSections = await genClientSdkNav(specFile, excludeName)

  const allVersionsMeta = REFERENCES[libPath]
  const availableVersions = allVersionsMeta?.versions ?? []
  const isMostRecentVersion = version === availableVersions[0]

  const basePath = `/reference/${libPath}${isMostRecentVersion ? '' : `/${version}`}`

  return (
    <div className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        {'icon' in menuData && <MenuIconPicker icon={menuData.icon} width={21} height={21} />}
        <span className="text-base text-brand-600">{name}</span>
        <RefVersionDropdown library={libPath} currentVersion={version} />
      </div>
      <ul className="flex flex-col gap-2">
        {navSections.map((section) => (
          <Fragment key={section.id}>
            {section.type === 'category' ? (
              <li>
                <RefCategory basePath={basePath} section={section} />
              </li>
            ) : (
              <li className={topLvlRefNavItemStyles}>
                <RefLink basePath={basePath} section={section} />
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </div>
  )
}

const topLvlRefNavItemStyles = 'leading-5'

function RefCategory({
  basePath,
  section,
}: {
  basePath: string
  section: AbbrevCommonClientLibSection
}) {
  if (!('items' in section && section.items.length > 0)) return null

  return (
    <>
      <Divider />
      {'title' in section && <SideMenuTitle className="py-2">{section.title}</SideMenuTitle>}
      <ul className="space-y-2">
        {section.items.map((item) => (
          <li key={item.id} className={topLvlRefNavItemStyles}>
            <RefLink basePath={basePath} section={item} />
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

export { ClientSdkNavigation }
export type { AbbrevCommonClientLibSection }
