'use client'

import type { User } from '@supabase/supabase-js'
import type { LucideIcon } from 'icons/src/createSupabaseIcon'
import { UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import {
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from 'ui'
import { themes } from 'ui/src/components/ThemeProvider/themes'
import type { Theme } from 'ui/src/components/ThemeProvider/themes'

interface Props {
  menu: menuItem[][]
  user: User | null
  hasThemeSelector?: boolean
  site?: 'docs' | 'www' | 'studio'
}

export interface menuItem {
  label: string
  type?: 'link' | 'button' | 'text' | 'theme'
  icon?: LucideIcon
  href?: string
  shortcut?: string
  onClick?: VoidFunction
  otherProps?: {
    target?: '_blank'
    rel?: 'noreferrer noopener'
  }
}

export const AuthenticatedDropdownMenu = ({ user, menu, site }: Props) => {
  const { theme, setTheme } = useTheme()
  const userAvatar = user && user.user_metadata?.avatar_url

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="flex">
        <button
          title="Menu dropdown button"
          className={cn(
            buttonVariants({ type: 'default' }),
            'text-foreground-light border-default w-[30px] min-w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30 hover:border-strong data-[state=open]:border-stronger hover:!bg-overlay-hover/50 bg-transparent',
            'rounded-full overflow-hidden opacity-0 transition-opacity animate-fade-in'
          )}
        >
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={user?.email ?? ''}
              placeholder="blur"
              blurDataURL="/images/blur.png"
              fill
              sizes="30px"
              className="object-cover object-center"
            />
          ) : (
            <UserIcon size={16} strokeWidth={1.5} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {menu.map((menuSection, sectionIdx) => (
          <Fragment key={`${site}-auth-dropdown--${sectionIdx}`}>
            {sectionIdx !== 0 && (
              <DropdownMenuSeparator key={`${site}-auth-dropdown--${sectionIdx}`} />
            )}
            {menuSection.map((sectionItem, itemIdx) => {
              switch (sectionItem.type) {
                case 'text':
                  return (
                    <div
                      key={`${site}-auth-dropdown-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      className="flex cursor-text items-center text-foreground rounded-sm px-2 py-1.5 text-xs outline-none space-x-2"
                      {...sectionItem.otherProps}
                    >
                      <DropdownItemContent {...sectionItem} />
                    </div>
                  )
                case 'button':
                  return (
                    <DropdownMenuItem
                      key={`${site}-auth-dropdown-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      className="space-x-2 hover:cursor-pointer"
                      onClick={sectionItem.onClick!}
                      {...sectionItem.otherProps}
                    >
                      <DropdownItemContent {...sectionItem} />
                    </DropdownMenuItem>
                  )
                case 'theme':
                  return (
                    <>
                      <DropdownMenuLabel
                        key={`${site}-auth-dropdown-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      >
                        {sectionItem.label}
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={theme}
                        onValueChange={(value) => {
                          setTheme(value)
                        }}
                      >
                        {themes
                          .filter(
                            (x) => x.value === 'light' || x.value === 'dark' || x.value === 'system'
                          )
                          .map((theme: Theme) => (
                            <DropdownMenuRadioItem
                              key={`${site}-auth-dropdown-theme-${theme.value}`}
                              value={theme.value}
                              className="hover:cursor-pointer"
                            >
                              {theme.name}
                            </DropdownMenuRadioItem>
                          ))}
                      </DropdownMenuRadioGroup>
                    </>
                  )
                case 'link':
                default:
                  return (
                    <Link
                      key={`${site}-auth-dropdown-${sectionItem.label}-${sectionIdx}-${itemIdx}`}
                      href={sectionItem.href!}
                      {...sectionItem.otherProps}
                    >
                      <DropdownMenuItem
                        className="space-x-2 hover:cursor-pointer"
                        onClick={() => {}}
                      >
                        <DropdownItemContent {...sectionItem} />
                      </DropdownMenuItem>
                    </Link>
                  )
              }
            })}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const DropdownItemContent = ({ icon: Icon, ...sectionItem }: menuItem) => (
  <>
    {Icon && <Icon className="w-3 h-3" />}
    <span className="grow truncate">{sectionItem.label}</span>
    {sectionItem.shortcut && <DropdownMenuShortcut>{sectionItem.shortcut}</DropdownMenuShortcut>}
  </>
)

export default AuthenticatedDropdownMenu
