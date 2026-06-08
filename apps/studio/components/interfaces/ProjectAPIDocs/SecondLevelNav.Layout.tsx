import { ChevronLeft, Code } from 'lucide-react'
import { useMemo, useState, type PropsWithChildren, type ReactNode } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { navigateToSection } from './Content/Content.utils'
import { DOCS_RESOURCE_CONTENT } from './ProjectAPIDocs.constants'
import { DocsButton } from '@/components/ui/DocsButton'
import { useAppStateSnapshot } from '@/state/app-state'

type DocsResourceContentItem = (typeof DOCS_RESOURCE_CONTENT)[keyof typeof DOCS_RESOURCE_CONTENT]

export type MenuItemFilter = (item: DocsResourceContentItem) => boolean
export type ResourcePickerRenderProps = {
  selectedResource?: string
  onSelect: (value: string) => void
  closePopover: () => void
}

type SecondLevelNavLayoutProps = {
  category: string
  title: string
  docsUrl: string
  menuItemFilter?: MenuItemFilter
  renderResourceList: (props: ResourcePickerRenderProps) => ReactNode
}

export const SecondLevelNavLayout = ({
  category,
  title,
  docsUrl,
  menuItemFilter,
  renderResourceList,
}: SecondLevelNavLayoutProps) => {
  const snap = useAppStateSnapshot()
  const [, resource] = snap.activeDocsSection

  return (
    <SecondLevelNavOuterContainer>
      <SecondLevelNavInnerContainer>
        <NavTitle title={title} category={category} />
        <ResourcePicker
          category={category}
          resource={resource}
          renderResourceList={renderResourceList}
        />
        <MenuItems category={category} menuItemFilter={menuItemFilter} />
      </SecondLevelNavInnerContainer>

      <SecondLevelNavInnerContainer className="py-4 border-t">
        <MoreInformation docsUrl={docsUrl} />
      </SecondLevelNavInnerContainer>
    </SecondLevelNavOuterContainer>
  )
}

const SecondLevelNavOuterContainer = ({ children }: PropsWithChildren) => {
  return <div className="py-2">{children}</div>
}

type SecondLevelLevelNavInnerContainerProps = PropsWithChildren<{
  className?: string
}>

const SecondLevelNavInnerContainer = ({
  children,
  className,
}: SecondLevelLevelNavInnerContainerProps) => {
  return <div className={cn('px-4', className)}>{children}</div>
}

type ResourcePickerProps = {
  category: string
  resource?: string
  renderResourceList: (props: ResourcePickerRenderProps) => ReactNode
}

type NavTitleProps = {
  title: string
  category: string
}

const NavTitle = ({ title, category }: NavTitleProps) => {
  const snap = useAppStateSnapshot()
  const handleBack = () => {
    snap.setActiveDocsSection([category])
  }

  return (
    <div className="flex items-center space-x-2 mb-2">
      <Button type="text" icon={<ChevronLeft />} className="px-1" onClick={handleBack} />
      <p className="text-sm text-foreground-light capitalize">{title}</p>
    </div>
  )
}

const ResourcePicker = ({ category, resource, renderResourceList }: ResourcePickerProps) => {
  const snap = useAppStateSnapshot()

  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    snap.setActiveDocsSection([category, value])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="default"
          size="small"
          className="w-full justify-between gap-2"
          iconRight={<Code className="rotate-90" />}
        >
          <span className="truncate">{resource ?? 'Select a resource'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" side="bottom" align="center">
        {renderResourceList({
          selectedResource: resource,
          onSelect: handleSelect,
          closePopover: () => setOpen(false),
        })}
      </PopoverContent>
    </Popover>
  )
}

type MenuItemsProps = {
  category: string
  menuItemFilter?: MenuItemFilter
}

const MenuItems = ({ category, menuItemFilter }: MenuItemsProps) => {
  const menuItems = useMemo(() => {
    const items = Object.values(DOCS_RESOURCE_CONTENT).filter(
      (content) => content.category === category
    )
    return menuItemFilter ? items.filter(menuItemFilter) : items
  }, [category, menuItemFilter])

  return (
    <div className="py-4 space-y-2">
      {menuItems.map((item) => (
        <button
          key={item.key}
          className="w-full text-left text-sm text-foreground-light px-4 hover:text-foreground"
          onClick={() => navigateToSection(item.key)}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
}

type MoreInformationProps = {
  docsUrl: string
}

const MoreInformation = ({ docsUrl }: MoreInformationProps) => {
  return (
    <Alert className="p-3">
      <AlertTitle>
        <p className="text-xs">Unable to find what you're looking for?</p>
      </AlertTitle>
      <AlertDescription className="space-y-1">
        <p className="text-xs leading-normal!">
          The API methods shown here are only the commonly used ones to get you started building
          quickly.
        </p>
        <p className="text-xs leading-normal!">
          Head over to our docs site for the full API documentation.
        </p>
        <DocsButton className="mt-2!" href={docsUrl} />
      </AlertDescription>
    </Alert>
  )
}
