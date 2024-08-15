import React, { Fragment, MouseEvent, ReactNode, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useClickAway, useKey } from 'react-use'
import { CheckIcon, ClipboardIcon } from '@heroicons/react/outline'
import { cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

/**
 * Right click on the Supabase logo in the website navbar
 * for quick access to brand assets.
 */
const RightClickBrandLogo = () => {
  const ref = useRef(null)
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  /**
   * Close dropdown by clicking outside
   */
  useClickAway(ref, () => {
    setOpen(false)
  })

  /**
   * Close dropdown by using the Escape key
   */
  useKey('Escape', () => setOpen(false))

  /**
   * Open dropdown by right clicking on the Supabase logo
   */
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault()

    if (e.type === 'contextmenu' || e.nativeEvent.button === 2) {
      setOpen(true)
    }
  }

  /**
   * A11y open dropdown by typing Shift+Enter when the logo is focused
   */
  const handleKeyboardOpen = () => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        setOpen(true)
      }
    }

    document?.addEventListener('keydown', onKeyDown)
    return () => {
      document?.removeEventListener('keydown', onKeyDown)
    }
  }

  /**
   * Copy to clipboard logo SVG
   */
  const handleCopyToClipboard = (menuItem: MenuItemProps) => {
    navigator.clipboard.writeText(menuItem.clipboard ?? '').then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    })
  }

  return (
    <DropdownMenu open={open}>
      <DropdownMenuTrigger asChild>
        <Link
          href="/"
          onContextMenu={handleRightClick}
          onFocus={handleKeyboardOpen}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/')}
          className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
        >
          <Image
            src={supabaseLogoWordmarkLight}
            width={124}
            height={24}
            alt="Supabase Logo"
            className="dark:hidden"
            priority
          />
          <Image
            src={supabaseLogoWordmarkDark}
            width={124}
            height={24}
            alt="Supabase Logo"
            className="hidden dark:block"
            priority
          />
        </Link>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        autoFocus
        ref={ref}
        align="start"
        side="bottom"
        className="mt-2 p-0 w-52"
      >
        {menuItems.map((section, sectionIdx) => (
          <Fragment key={`cxtMenu-section-${sectionIdx}`}>
            {sectionIdx !== 0 && <DropdownSeparator />}
            <div className="p-1">
              {section.map((menuItem, i) => (
                <DropdownMenuItem
                  autoFocus
                  asChild
                  key={menuItem.label}
                  className="w-full flex justify-between gap-2 items-center !p-2"
                >
                  {menuItem.type === 'download' || menuItem.type === 'link' ? (
                    <Link
                      href={menuItem.href ?? ''}
                      download={menuItem.type === 'download'}
                      className="group/menu-item w-full text-left flex justify-between gap-2 items-center"
                    >
                      <MenuItemContent {...menuItem} />
                    </Link>
                  ) : (
                    menuItem.type === 'clipboard' && (
                      <button
                        className="group/menu-item w-full text-left flex justify-between gap-2 items-center"
                        onClick={() => handleCopyToClipboard(menuItem)}
                      >
                        <MenuItemContent copied={copied} {...menuItem} />
                      </button>
                    )
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const DropdownSeparator = () => <div className="h-px w-full bg-border" />

interface MenuItemProps {
  label: string
  type: 'clipboard' | 'download' | 'link'
  icon?: ReactNode
  href?: string
  clipboard?: string
}

/**
 * Brand assets dropdown menu items.
 * First array is to divide the menu by sections;
 * Second array is the list of items inside each section.
 */
const menuItems: MenuItemProps[][] = [
  [
    {
      label: 'Copy logo as SVG',
      type: 'clipboard',
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.95127 2.53536C7.94394 2.04707 7.3269 1.83752 7.02259 2.21997L2.43035 7.99124C1.88831 8.67243 2.37446 9.67704 3.24613 9.67704H7.99525L8.05109 13.3962C8.05842 13.8844 8.67544 14.094 8.97976 13.7116L13.572 7.94026C14.114 7.25907 13.6279 6.25446 12.7562 6.25446H7.97574L7.95127 2.53536Z"
            fill="currentColor"
          />
        </svg>
      ),
      clipboard: `<svg width="109" height="113" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
<path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fill-opacity="0.2"/>
<path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
<defs>
<linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
<stop stop-color="#249361"/>
<stop offset="1" stop-color="#3ECF8E"/>
</linearGradient>
<linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
<stop/>
<stop offset="1" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`,
    },
    {
      label: 'Download wordmark',
      type: 'download',
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.66669 6.66675L8.00002 10.0001L11.3334 6.66675"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10V2"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      href: '/supabase-wordmark.zip',
    },
    {
      label: 'Download brand assets',
      type: 'download',
      href: '/brand-assets.zip',
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.66669 6.66675L8.00002 10.0001L11.3334 6.66675"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10V2"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ],
  [
    {
      label: 'Brand Assets',
      type: 'link',
      href: '/brand-assets',
    },
  ],
]

interface MenuItemContentProps {
  icon?: ReactNode
  type: string
  label: string
  copied?: boolean
}

/**
 * MenuItem content
 */
const MenuItemContent = ({ icon, type, label, copied }: MenuItemContentProps) => (
  <>
    {icon && <span className="text-foreground-lighter">{icon}</span>}
    <span className="grow">{label}</span>
    {type === 'clipboard' && (
      <span className="w-4 opacity-0 flex items-center justify-center group-hover/menu-item:opacity-100 group-focus/menu-item:opacity-100 group-focus-visible/menu-item:opacity-100">
        {!copied ? (
          <ClipboardIcon
            strokeWidth={1}
            className={cn(
              'h-3 transition-opacity opacity-0 duration-300',
              !copied && 'opacity-100'
            )}
          />
        ) : (
          <CheckIcon
            strokeWidth={1}
            className={cn('h-3 transition-opacity opacity-0 duration-300', copied && 'opacity-100')}
          />
        )}
      </span>
    )}
  </>
)

export default RightClickBrandLogo
