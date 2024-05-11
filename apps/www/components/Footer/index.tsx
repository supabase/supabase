import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Badge, IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid, cn } from 'ui'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { CheckIcon } from '@heroicons/react/outline'
import SectionContainer from '../Layouts/SectionContainer'

import footerData from 'data/Footer'
import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'
import { ThemeToggle } from 'ui-patterns/ThemeToggle'

interface Props {
  className?: string
  hideFooter?: boolean
}

const Footer = (props: Props) => {
  const { resolvedTheme } = useTheme()
  const { pathname } = useRouter()

  const isLaunchWeek = pathname.includes('/launch-week')
  const isGAWeek = pathname.includes('/ga-week')
  const forceDark = isLaunchWeek || pathname === '/'

  if (props.hideFooter) {
    return null
  }

  return (
    <footer
      className={cn(
        'bg-alternative',
        isLaunchWeek && 'bg-[#060809]',
        isGAWeek && 'dark:bg-alternative',
        props.className
      )}
      aria-labelledby="footerHeading"
    >
      <h2 id="footerHeading" className="sr-only">
        Footer
      </h2>
      <div className="w-full !py-0">
        <SectionContainer className="grid grid-cols-2 md:flex items-center justify-between text-foreground md:justify-center gap-8 md:gap-16 xl:gap-28 !py-6 md:!py-10 text-sm">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            We protect your data.
            <Link href="/security" className="text-brand hover:underline">
              More on Security
            </Link>
          </div>
          <ul className="flex flex-col md:flex-row gap-2 md:gap-8 justify-center md:items-center">
            <li className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
              <CheckIcon className="w-4 h-4" /> SOC2 Type 2{' '}
              <span className="text-foreground-lighter hidden sm:inline">Certified</span>
            </li>
            <li className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
              <CheckIcon className="w-4 h-4" /> HIPAA{' '}
              <span className="text-foreground-lighter hidden sm:inline">Compliant</span>
            </li>
          </ul>
        </SectionContainer>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <SectionContainer className="py-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="#" as="/" className="w-40">
              <Image
                src={supabaseLogoWordmarkLight}
                width={160}
                height={30}
                alt="Supabase Logo"
                className="dark:hidden"
                priority
              />
              <Image
                src={supabaseLogoWordmarkDark}
                width={160}
                height={30}
                alt="Supabase Logo"
                className="hidden dark:block"
                priority
              />
            </Link>
            <div className="flex space-x-5">
              <a
                href="https://twitter.com/supabase"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">Twitter</span>
                <IconTwitterX size={22} />
              </a>

              <a
                href="https://github.com/supabase"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">GitHub</span>
                <IconGitHubSolid size={22} />
              </a>

              <a
                href="https://discord.supabase.com/"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">Discord</span>
                <IconDiscord size={22} />
              </a>

              <a
                href="https://youtube.com/c/supabase"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">Youtube</span>
                <IconYoutubeSolid size={22} />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 xl:col-span-2 xl:mt-0">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {footerData.map((segment) => {
                return (
                  <div key={`footer_${segment.title}`}>
                    <h6 className="text-foreground overwrite text-base">{segment.title}</h6>
                    <ul className="mt-4 space-y-2">
                      {segment.links.map(({ component: Component, ...link }, idx) => {
                        const children = (
                          <div
                            className={`text-sm transition-colors ${
                              link.url || Component
                                ? 'text-foreground-lighter hover:text-foreground'
                                : 'text-muted hover:text-foreground-lighter'
                            } `}
                          >
                            {link.text}
                            {!link.url && !Component && (
                              <div className="ml-2 inline text-xs xl:ml-0 xl:block 2xl:ml-2 2xl:inline">
                                <Badge size="small">Coming soon</Badge>
                              </div>
                            )}
                          </div>
                        )

                        return (
                          <li key={`${segment.title}_link_${idx}`}>
                            {link.url ? (
                              link.url.startsWith('https') ? (
                                <a href={link.url}>{children}</a>
                              ) : (
                                <Link href={link.url}>{children}</Link>
                              )
                            ) : (
                              Component && <Component>{children}</Component>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="border-default mt-32 flex justify-between border-t pt-8">
          <small className="small">&copy; Supabase Inc</small>
          <div className={cn(forceDark && 'hidden')}>
            <ThemeToggle forceDark={forceDark} />
          </div>
        </div>
      </SectionContainer>
    </footer>
  )
}

export default Footer
