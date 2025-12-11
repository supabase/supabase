// import { docsConfig } from '@/config/docs'
import Link from 'next/link'
import { CommandMenu } from './command-menu'
import { HomepageSvgHandler } from './homepage-svg-handler'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'

function TopNavigation() {
  return (
    <header className="sticky top-0 z-50 w-full bg-studio/95 backdrop-blur supports-[backdrop-filter]:bg-studio/60 border-b border-l border-r">
      <nav className="py-3 w-full flex">
        <div className="max-w-site w-full flex flex-row items-center gap-6 mx-auto px-6 justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center lg:gap-6 gap-4">
              <h1 className="hidden md:flex line-clamp-1 lg:text-2xl text-base">
                Supabase Design System
              </h1>
              <HomepageSvgHandler name="design-system-marks" className="h-4 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <CommandMenu />
            <ThemeSwitcherDropdown />
          </div>
        </div>
      </nav>
    </header>
  )
}

export default TopNavigation
