'use client'

import { CircleCheckFilled, CrossfadeIcon } from '~/components/CrossfadeIcon'
import { Copy, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/compat/router'
import Link from 'next/link'
import { Fragment, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import {
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import SupabaseWordmark from './SupabaseWordmark'

/**
 * Right click on the Supabase logo in the website navbar
 * for quick access to brand assets.
 */
const RightClickBrandLogo = () => {
  const ref = useRef(null)
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null)
  const [logoHighlight, setLogoHighlight] = useState<MenuItemProps['logoHighlight']>()
  const { resolvedTheme } = useTheme()

  /**
   * Close dropdown by clicking outside
   */
  useClickAway(ref, () => {
    setOpen(false)
  })

  /**
   * Close dropdown by using the Escape key
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  /**
   * Open dropdown by right clicking on the Supabase logo
   */
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault()

    if (e.type === 'contextmenu' || e.nativeEvent.button === 2) {
      setLogoHighlight(undefined)
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
    // the ClipboardItem promise keeps the fetched copy inside the user gesture in safari
    // the copied file matches the nav logo, which follows the site theme
    const clipboardUrl =
      menuItem.clipboardUrls?.[resolvedTheme?.includes('dark') ? 'dark' : 'light']
    if (!clipboardUrl) return
    copyToClipboard(
      fetch(clipboardUrl).then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${clipboardUrl}`)
        return response.text()
      }),
      () => {
        setCopiedLabel(menuItem.label)
        setTimeout(() => {
          setCopiedLabel(null)
        }, 2000)
      }
    )
  }

  const handleItemPointerEnter = (menuItem: MenuItemProps) =>
    setLogoHighlight(menuItem.logoHighlight)

  const handleMenuPointerLeave = () => setLogoHighlight(undefined)

  const isFrameVisible = open && logoHighlight !== undefined
  const isFrameOnSymbol = logoHighlight !== 'wordmark'

  return (
    <DropdownMenu open={open}>
      <DropdownMenuTrigger asChild>
        <Link
          href="/"
          onContextMenu={handleRightClick}
          onFocus={handleKeyboardOpen}
          onKeyDown={(e) => e.key === 'Enter' && router?.push('/')}
          className={cn(
            'relative isolate block w-auto h-6 box-content -mx-2 -my-3 px-2 py-3 focus-ring focus-visible:ring-offset-background-alternative rounded-md',
            'transition-colors duration-200 ease-out motion-reduce:transition-none',
            isFrameVisible && isFrameOnSymbol && 'text-foreground-muted'
          )}
        >
          <SupabaseWordmark />
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-1.5 left-0.5 -z-10',
              'rounded-md bg-overlay',
              'transition-all duration-200 ease-out motion-reduce:transition-none',
              isFrameOnSymbol ? 'w-9' : 'w-[calc(100%-0.25rem)]',
              isFrameVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            )}
          />
        </Link>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        autoFocus
        ref={ref}
        align="start"
        alignOffset={2}
        side="bottom"
        className="mt-2 p-0 w-52"
        onPointerLeave={handleMenuPointerLeave}
      >
        {menuItems.map((section, sectionIdx) => (
          <Fragment key={`cxtMenu-section-${sectionIdx}`}>
            {sectionIdx !== 0 && <DropdownSeparator />}
            <div className="p-1">
              {section.map((menuItem, i) => (
                <DropdownMenuItem
                  asChild
                  key={menuItem.label}
                  onPointerEnter={() => handleItemPointerEnter(menuItem)}
                  className="w-full flex justify-between gap-2 items-center p-2!"
                >
                  {menuItem.type === 'download' || menuItem.type === 'link' ? (
                    <Link
                      href={menuItem.href ?? ''}
                      download={menuItem.type === 'download'}
                      className="w-full text-left flex justify-between gap-2 items-center"
                    >
                      <MenuItemContent {...menuItem} />
                    </Link>
                  ) : (
                    menuItem.type === 'clipboard' && (
                      // DropdownMenuItem asChild manages roving tabIndex; don't override it.
                      // eslint-disable-next-line supabase/require-explicit-tabindex -- in-menu item
                      <button
                        className="w-full text-left flex justify-between gap-2 items-center"
                        onClick={() => handleCopyToClipboard(menuItem)}
                      >
                        <MenuItemContent copied={copiedLabel === menuItem.label} {...menuItem} />
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
  clipboardUrls?: Record<'light' | 'dark', string>
  logoHighlight?: 'icon' | 'wordmark'
}

/**
 * Brand assets dropdown menu items.
 * First array is to divide the menu by sections;
 * Second array is the list of items inside each section.
 */
const menuItems: MenuItemProps[][] = [
  [
    {
      label: 'Copy logo',
      logoHighlight: 'icon',
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
      clipboardUrls: {
        light: '/brand-assets/supabase-icon-green-transparent.svg',
        dark: '/brand-assets/supabase-icon-green-transparent.svg',
      },
    },
    {
      label: 'Copy wordmark',
      logoHighlight: 'wordmark',
      type: 'clipboard',
      icon: <Copy strokeWidth={1.5} className="size-4" />,
      clipboardUrls: {
        light: '/brand-assets/supabase-logo-green-black-transparent.svg',
        dark: '/brand-assets/supabase-logo-green-white-transparent.svg',
      },
    },
    {
      label: 'Download wordmark',
      type: 'download',
      icon: <Download strokeWidth={1.5} className="size-4" />,
      href: '/supabase-wordmark.zip',
    },
    {
      label: 'Download brand assets',
      type: 'download',
      href: '/brand-assets.zip',
      icon: <Download strokeWidth={1.5} className="size-4" />,
    },
  ],
  [
    {
      label: 'Go to Brand Assets',
      type: 'link',
      href: '/brand-assets',
    },
  ],
]

interface MenuItemContentProps {
  icon?: ReactNode
  label: string
  copied?: boolean
}

/**
 * MenuItem content
 */
const MenuItemContent = ({ icon, label, copied }: MenuItemContentProps) => (
  <>
    {icon && (
      <span className="text-foreground-lighter">
        {copied === undefined ? (
          icon
        ) : (
          <CrossfadeIcon
            isActive={copied}
            activeIcon={<CircleCheckFilled className="size-4" />}
            inactiveIcon={icon}
            className="size-4"
          />
        )}
      </span>
    )}
    <span className="grow">{label}</span>
  </>
)

export default RightClickBrandLogo
