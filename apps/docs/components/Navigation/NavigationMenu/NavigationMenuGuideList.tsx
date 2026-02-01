'use client'

import * as Accordion from '@radix-ui/react-accordion'

import { type NavMenuSection } from '../Navigation.types'
import * as NavItems from './NavigationMenu.constants'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { MenuId } from './NavigationMenu'

const NavigationMenuGuideList = ({
  id,
  additionalNavItems,
}: {
  id: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}) => {
  const pathname = usePathname()
  const firstLevelRoute = pathname?.split('/')?.slice(0, 4)?.join('/')

  // eslint-disable-next-line import/namespace -- dynamic access, can't lint properly
  let menu = NavItems[id]

  if (id === MenuId.Integrations && additionalNavItems?.integrations) {
    const integrationsListIndex = menu.items.findIndex((item) => item.name === 'Integrations')
    if (integrationsListIndex !== -1) {
      menu = {
        ...menu,
        items: [
          ...menu.items.slice(0, integrationsListIndex),
          {
            ...menu.items[integrationsListIndex],
            items: [...menu.items[integrationsListIndex].items, ...additionalNavItems.integrations],
          },
          ...menu.items.slice(integrationsListIndex + 1),
        ],
      }
    }
  }

  // Inject federated prompts into the 'AI Tools > Prompts' section
  if (id === MenuId.GettingStarted && additionalNavItems?.prompts) {
    const aiToolsSectionIndex = menu.items.findIndex((item) => item.name === 'AI Tools')
    if (aiToolsSectionIndex !== -1) {
      const beforeAITools = menu.items.slice(0, aiToolsSectionIndex)
      const afterAITools = menu.items.slice(aiToolsSectionIndex + 1)

      const aiToolsSection = menu.items[aiToolsSectionIndex]
      const promptsSectionIndex = aiToolsSection.items.findIndex((item) => item.name === 'Prompts')

      if (promptsSectionIndex !== -1) {
        const beforePrompts = aiToolsSection.items.slice(0, promptsSectionIndex)
        const afterPrompts = aiToolsSection.items.slice(promptsSectionIndex + 1)

        const promptsSection = aiToolsSection.items[promptsSectionIndex]

        const modifiedPromptsSection = {
          ...promptsSection,
          items: additionalNavItems.prompts,
        }

        const modifiedAIToolsSection = {
          ...aiToolsSection,
          items: [...beforePrompts, modifiedPromptsSection, ...afterPrompts],
        }

        menu = {
          ...menu,
          items: [...beforeAITools, modifiedAIToolsSection, ...afterAITools],
        }
      }
    }
  }

  // Inject skills into the 'AI Tools > Skills' section
  if (id === MenuId.GettingStarted && additionalNavItems?.skills) {
    const aiToolsSectionIndex = menu.items.findIndex((item) => item.name === 'AI Tools')
    if (aiToolsSectionIndex !== -1) {
      const beforeAITools = menu.items.slice(0, aiToolsSectionIndex)
      const afterAITools = menu.items.slice(aiToolsSectionIndex + 1)

      const aiToolsSection = menu.items[aiToolsSectionIndex]
      const skillsSectionIndex = aiToolsSection.items.findIndex((item) => item.name === 'Skills')

      if (skillsSectionIndex !== -1) {
        const beforeSkills = aiToolsSection.items.slice(0, skillsSectionIndex)
        const afterSkills = aiToolsSection.items.slice(skillsSectionIndex + 1)

        const skillsSection = aiToolsSection.items[skillsSectionIndex]

        const modifiedSkillsSection = {
          ...skillsSection,
          items: additionalNavItems.skills,
        }

        const modifiedAIToolsSection = {
          ...aiToolsSection,
          items: [...beforeSkills, modifiedSkillsSection, ...afterSkills],
        }

        menu = {
          ...menu,
          items: [...beforeAITools, modifiedAIToolsSection, ...afterAITools],
        }
      }
    }
  }

  return (
    <NavigationMenuGuideListWrapper id={id} firstLevelRoute={firstLevelRoute}>
      <NavigationMenuGuideListItems menu={menu} id={id} />
    </NavigationMenuGuideListWrapper>
  )
}

export function NavigationMenuGuideListWrapper({
  id,
  firstLevelRoute,
  children,
}: PropsWithChildren<{
  id: string
  firstLevelRoute?: string
}>) {
  return (
    <Accordion.Root
      collapsible={true}
      key={id}
      type="single"
      value={firstLevelRoute}
      className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150 w-full"
    >
      {children}
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList
