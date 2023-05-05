import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Badge } from '~/../../packages/ui'

import { HOMEPAGE_MENU_ITEMS } from './NavigationMenu.constants'
import HomeMenuIconPicker from './HomeMenuIconPicker'

const NavigationMenuHome = ({ active }) => {
  return (
    <div
      className={[
        'transition-all duration-150 ease-out',
        active ? 'opacity-100 ml-0 delay-150' : 'opacity-0 -ml-8 invisible absolute',
      ].join(' ')}
    >
      <ul className="relative w-full flex flex-col gap-4">
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
                <div className="flex flex-col gap-3">
                  {section.map((link) => {
                    if (!link.href) {
                      return (
                        <span
                          key={link.label}
                          className="font-mono uppercase text-xs text-scale-900"
                        >
                          {link.label}
                        </span>
                      )
                    } else {
                      return (
                        <Link href={link.href} passHref key={link.label}>
                          <a>
                            <li
                              className={[
                                'group flex items-center gap-3',
                                'text-base transition-all duration-150 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
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
