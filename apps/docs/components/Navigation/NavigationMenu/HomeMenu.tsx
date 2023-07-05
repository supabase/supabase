import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Badge, cn } from 'ui'
import { HOMEPAGE_MENU_ITEMS } from './NavigationMenu.constants'
import HomeMenuIconPicker from './HomeMenuIconPicker'

const NavigationMenuHome = () => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  return (
    <div className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150">
      <ul className="relative w-full flex flex-col gap-4 pb-5">
        {HOMEPAGE_MENU_ITEMS.map((section, sectionIndex) => {
          return (
            <Fragment key={`section-container-${sectionIndex}-border`}>
              {sectionIndex !== 0 && (
                <div
                  className="h-px w-full bg-blackA-300 dark:bg-whiteA-300"
                  key={`section-${sectionIndex}-border`}
                ></div>
              )}
              <div key={`section-${sectionIndex}`}>
                <div className="flex flex-col gap-4">
                  {section.map((link, i) => {
                    if (!link.href) {
                      return (
                        <div
                          key={link.label}
                          className={cn(
                            'font-mono uppercase text-xs text-scale-900 ',
                            i !== 0 && 'mt-4'
                          )}
                        >
                          {link.label}
                        </div>
                      )
                    } else {
                      return (
                        <Link href={link.href} passHref key={link.label}>
                          <a>
                            <li
                              className={[
                                'group flex items-center gap-2',
                                'text-sm transition-all duration-150 text-scale-1100 hover:text-scale-1200  hover:cursor-pointer ',
                              ].join(' ')}
                            >
                              {link?.icon && <HomeMenuIconPicker icon={link.icon} />}
                              {link.label}
                              {link.community && <Badge size="small">Community</Badge>}
                            </li>
                          </a>
                        </Link>
                      )
                    }
                  })}
                </div>
              </div>
            </Fragment>
          )
        })}
      </ul>
    </div>
  )
}

export default NavigationMenuHome
