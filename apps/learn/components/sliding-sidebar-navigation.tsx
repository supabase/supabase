'use client'

import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn, ScrollArea } from 'ui'

import { CommandMenu } from './command-menu'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'
import { courses } from '@/config/docs'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import type { SidebarNavItem } from '@/types/nav'

type Panel = 'courses' | 'modules' | 'lessons'

interface NavigationState {
  panel: Panel
  selectedCourse: SidebarNavItem | null
  selectedModule: SidebarNavItem | null
}

const SlidingSidebarNavigation = () => {
  const pathname = usePathname()
  const { setOpen } = useMobileMenu()
  const [navState, setNavState] = useState<NavigationState>({
    panel: 'courses',
    selectedCourse: null,
    selectedModule: null,
  })

  // Find active course, module, and lesson based on pathname
  useEffect(() => {
    const course = courses.items[0] // Foundations - only one course for now
    if (!course) return

    // Check if we're on a lesson page
    let foundModule: SidebarNavItem | null = null
    let foundLesson = false

    course.items?.forEach((item) => {
      if (item.items) {
        // It's a module
        item.items.forEach((lesson) => {
          if (lesson.href === pathname) {
            foundModule = item
            foundLesson = true
          }
        })
      } else if (item.href === pathname) {
        // Standalone lesson (like Introduction)
        foundLesson = true
      }
    })

    // If we're on a lesson page, show the lessons panel
    if (foundLesson && foundModule) {
      setNavState({
        panel: 'lessons',
        selectedCourse: course,
        selectedModule: foundModule,
      })
    } else if (foundLesson) {
      // On a standalone lesson, show modules panel
      setNavState({
        panel: 'modules',
        selectedCourse: course,
        selectedModule: null,
      })
    }
  }, [pathname])

  const handleCourseClick = (course: SidebarNavItem) => {
    setNavState({
      panel: 'modules',
      selectedCourse: course,
      selectedModule: null,
    })
  }

  const handleModuleClick = (module: SidebarNavItem) => {
    setNavState({
      panel: 'lessons',
      selectedCourse: navState.selectedCourse,
      selectedModule: module,
    })
  }

  const handleBackToCourses = () => {
    setNavState({
      panel: 'courses',
      selectedCourse: null,
      selectedModule: null,
    })
  }

  const handleBackToModules = () => {
    setNavState({
      ...navState,
      panel: 'modules',
      selectedModule: null,
    })
  }

  const handleLessonClick = () => {
    // Close mobile menu when navigating
    setOpen(false)
  }

  // Check if a module contains the active lesson
  const moduleContainsActiveLesson = (module: SidebarNavItem) => {
    return module.items?.some((lesson) => lesson.href === pathname)
  }

  // Separate standalone items (no children) from modules (with children)
  const getStandaloneAndModules = (items?: SidebarNavItem[]) => {
    const standalone: SidebarNavItem[] = []
    const modules: SidebarNavItem[] = []

    items?.forEach((item) => {
      if (item.items && item.items.length > 0) {
        modules.push(item)
      } else {
        standalone.push(item)
      }
    })

    return { standalone, modules }
  }

  return (
    <nav className="flex flex-col h-full min-w-[320px] bg-background-surface border-r border-border">
      {/* Header */}
      <div className="p-6 flex-shrink-0 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <Link href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="109"
              height="113"
              viewBox="0 0 109 113"
              fill="none"
              className="w-6 h-6"
            >
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0625L99.1935 40.0625C107.384 40.0625 111.952 49.5226 106.859 55.9372L63.7076 110.284Z"
                fill="url(#paint0_linear)"
              />
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0625L99.1935 40.0625C107.384 40.0625 111.952 49.5226 106.859 55.9372L63.7076 110.284Z"
                fill="url(#paint1_linear)"
                fillOpacity="0.2"
              />
              <path
                d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient
                  id="paint0_linear"
                  x1="53.9738"
                  y1="54.9738"
                  x2="94.1635"
                  y2="71.8293"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#249361" />
                  <stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear"
                  x1="36.1558"
                  y1="30.5779"
                  x2="54.4844"
                  y2="65.0804"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
          <ThemeSwitcherDropdown />
        </div>
        <Link href="/" className="mb-4 block">
          <h1>Learn Supabase</h1>
        </Link>
        <CommandMenu />
      </div>

      <div className="relative overflow-hidden flex-1">
        {/* Panel 1: Courses */}
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 ease-in-out',
            navState.panel === 'courses' ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <ScrollArea className="h-full">
            <div className="p-5">
              <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                Courses
              </h2>
              <ul className="space-y-1">
                {courses.items.map((course) => (
                  <li key={course.title}>
                    <button
                      onClick={() => handleCourseClick(course)}
                      className="w-full text-left px-3 py-2 text-sm text-foreground-light hover:bg-surface-100 hover:text-foreground rounded-md transition-colors group flex items-center justify-between"
                    >
                      <span>{course.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>

        {/* Panel 2: Modules */}
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 ease-in-out',
            navState.panel === 'modules'
              ? 'translate-x-0'
              : navState.panel === 'courses'
                ? 'translate-x-full'
                : '-translate-x-full'
          )}
        >
          <ScrollArea className="h-full">
            <div className="p-5">
              {/* Back button */}
              <button
                onClick={handleBackToCourses}
                className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground mb-4 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Courses</span>
              </button>

              {/* Chapters heading */}
              {navState.selectedCourse && (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-6">Chapters</h2>

                  {(() => {
                    const { standalone, modules } = getStandaloneAndModules(
                      navState.selectedCourse.items
                    )
                    return (
                      <>
                        {/* Standalone lessons */}
                        {standalone.length > 0 && (
                          <ul className="space-y-1 mb-6">
                            {standalone.map((item) => {
                              const isIntroduction = item.title
                                .toLowerCase()
                                .includes('introduction')
                              return (
                                <li key={item.href}>
                                  <Link
                                    href={item.href || '#'}
                                    onClick={handleLessonClick}
                                    className={cn(
                                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors font-semibold',
                                      pathname === item.href
                                        ? 'bg-brand-500/10 text-foreground'
                                        : 'text-foreground hover:bg-surface-100'
                                    )}
                                  >
                                    <span>{item.title}</span>
                                    {isIntroduction && (
                                      <Info
                                        className="w-5 h-5 text-foreground-muted"
                                        strokeWidth={2}
                                      />
                                    )}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}

                        {/* Modules */}
                        <ul className="space-y-1">
                          {modules.map((module) => {
                            const isActive = moduleContainsActiveLesson(module)
                            return (
                              <li key={module.title}>
                                <button
                                  onClick={() => handleModuleClick(module)}
                                  className={cn(
                                    'w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between',
                                    isActive
                                      ? 'bg-brand-500/5 text-foreground font-semibold'
                                      : 'text-foreground hover:bg-surface-100'
                                  )}
                                >
                                  <span>{module.title}</span>
                                  <ChevronRight
                                    className="w-4 h-4 text-foreground-lighter"
                                    strokeWidth={2}
                                  />
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Panel 3: Lessons */}
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 ease-in-out',
            navState.panel === 'lessons' ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <ScrollArea className="h-full">
            <div className="p-5">
              {/* Back button */}
              <button
                onClick={handleBackToModules}
                className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground mb-4 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Chapters</span>
              </button>

              {/* Module title */}
              {navState.selectedModule && (
                <>
                  <h3 className="text-base font-medium text-foreground mb-4">
                    {navState.selectedModule.title}
                  </h3>

                  {/* Lessons */}
                  <ul className="space-y-1">
                    {navState.selectedModule.items?.map((lesson) => (
                      <li key={lesson.href}>
                        <Link
                          href={lesson.href || '#'}
                          onClick={handleLessonClick}
                          className={cn(
                            'block px-3 py-2 text-sm rounded-md transition-colors',
                            pathname === lesson.href
                              ? 'bg-brand-500/10 text-foreground font-semibold'
                              : 'text-foreground hover:bg-surface-100'
                          )}
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </nav>
  )
}

export { SlidingSidebarNavigation }
