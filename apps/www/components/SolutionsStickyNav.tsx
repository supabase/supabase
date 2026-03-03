import React from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import SectionContainer from 'components/Layouts/SectionContainer'
import {
  SolutionTypes,
  appTypeSolutions,
  migrationSolutions,
  skillBasedSolutions,
  useCaseSolutions,
} from 'data/Solutions'

interface Props {
  activeItem: SolutionTypes
  className?: string
  type?: 'skill-based' | 'use-case' | 'migration' | 'app-type'
}

function SolutionsStickyNav({ type, activeItem, className }: Props) {
  const router = useRouter()
  const solutions =
    type === 'skill-based'
      ? skillBasedSolutions.solutions
      : type === 'use-case'
        ? useCaseSolutions.solutions
        : type === 'app-type'
          ? appTypeSolutions.solutions
          : migrationSolutions.solutions
  const items = solutions.map((solution: any) => ({
    id: solution.id,
    name: solution.text,
    href: solution.url,
    icon: solution.icon,
  }))

  const activeSolution = items.find((item) => item.id === activeItem)

  return (
    <>
      <div className="absolute inset-0 z-30 h-full w-full pointer-events-none">
        <nav
          className={cn(
            'sticky z-30 flex items-center bg-background/90 w-full border-b backdrop-blur-sm pointer-events-auto top-[65px]',
            className
          )}
        >
          {/* mobile */}
          <SectionContainer className="!p-2 flex items-start md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="text"
                  iconRight={<ChevronDown />}
                  className="w-full min-w-[200px] flex justify-between items-center py-2"
                >
                  {activeSolution?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {items.map((item) => (
                  <DropdownMenuItem
                    key={`item-${item}`}
                    onClick={() => router.push(item.href)}
                    className={cn(item.id === activeItem ? 'text-brand-600' : '')}
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SectionContainer>
          {/* desktop */}
          <SectionContainer className="!py-0 hidden md:flex gap-3 items-center">
            {items.map((item: any) => {
              const isActive = item.id === activeItem

              return (
                <Link
                  key={item.name}
                  className={cn(
                    'flex items-center gap-1.5 px-2 first:-ml-2 py-4 border-b border-transparent text-sm text-foreground-lighter hover:text-foreground',
                    'focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground focus-visible:outline-brand-600',
                    isActive && 'border-foreground-light text-foreground'
                  )}
                  href={item.href}
                >
                  {item.icon &&
                    (typeof item.icon === 'string' ? (
                      <svg
                        className="h-4 w-4 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 18"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1"
                          d={item.icon}
                          stroke="currentColor"
                        />
                      </svg>
                    ) : (
                      <item.icon className="h-4 w-4" />
                    ))}
                  <p>{item.name}</p>
                </Link>
              )
            })}
          </SectionContainer>
        </nav>
      </div>
      <div className="h-[53px] not-sr-only" />
    </>
  )
}

export default SolutionsStickyNav
