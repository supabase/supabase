import Link from 'next/link'

import { CommandMenu } from './command-menu'
import { ThemeSwitcherDropdown } from './theme-switcher-dropdown'
import NavigationItem from '@/components/side-navigation-item'
import { aiEditorsRules, componentPages, gettingStarted, platformBlocks } from '@/config/docs'

function SideNavigation() {
  return (
    <nav className="flex flex-col h-full min-w-[220px]">
      <div className="p-6">
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
          <h1>Supabase UI Library</h1>
        </Link>
        {/* <TopNavigationSearch /> */}
        <CommandMenu />
      </div>
      <div className="pb-6 space-y-0.5">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          {gettingStarted.title}
        </div>
        {gettingStarted.items.map((item, i) => (
          <NavigationItem item={item} key={`${item.href}-${i}`} />
        ))}
      </div>
      <div className="pb-6">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          Blocks
        </div>
        <div className="space-y-0.5">
          {/* Render items based on component definitions */}
          {componentPages.items.map((component, i) => (
            <NavigationItem
              item={component}
              key={`${component.href?.toString() || component.title}-${i}`}
            />
          ))}
        </div>
      </div>

      <div className="pb-6 flex-1">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          {aiEditorsRules.title}
        </div>
        {aiEditorsRules.items.map((item, i) => (
          <NavigationItem item={item} key={`${item.href}-${i}`} />
        ))}
      </div>
      <div className="pb-6">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          {platformBlocks.title}
        </div>
        {platformBlocks.items.map((item, i) => (
          <NavigationItem item={item} key={`${item.href}-${i}`} />
        ))}
      </div>
    </nav>
  )
}

export default SideNavigation
