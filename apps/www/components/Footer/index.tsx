'use client'

import { CheckIcon } from '@heroicons/react/outline'
import { REALTIME_CHANNEL_STATES } from '@supabase/supabase-js'
import SupabaseWordmark from '~/components/Nav/SupabaseWordmark'
import supabase from '~/lib/supabase'
import footerData from 'data/Footer'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  cn,
  IconDiscord,
  IconGitHubSolid,
  IconInstagram,
  IconTikTok,
  IconTwitterX,
  IconYoutubeSolid,
  Input_Shadcn_,
} from 'ui'
import { ThemeToggle } from 'ui-patterns/ThemeToggle'

import useDarkLaunchWeeks from '../../hooks/useDarkLaunchWeeks'
import SectionContainer from '../Layouts/SectionContainer'

interface Props {
  className?: string
  hideFooter?: boolean
}

const Footer = (props: Props) => {
  const pathname = usePathname()

  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterStatus('loading')
    try {
      const res = await fetch('/api-v2/submit-form-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      if (!res.ok) throw new Error()
      setNewsletterStatus('success')
    } catch {
      setNewsletterStatus('error')
    }
  }

  const isDarkLaunchWeek = useDarkLaunchWeeks()
  const isGAWeek = pathname?.includes('/ga-week')
  const forceDark = isDarkLaunchWeek

  useEffect(() => {
    const channel = supabase.channel('footer')
    if (channel.state === REALTIME_CHANNEL_STATES.closed) {
      channel.subscribe()
    }
    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (props.hideFooter) {
    return null
  }

  return (
    <footer
      className={cn(
        'bg-alternative',
        isDarkLaunchWeek && 'bg-[#060809]',
        isGAWeek && 'dark:bg-alternative',
        props.className
      )}
    >
      <h2 id="footerHeading" className="sr-only">
        Footer
      </h2>
      <div className="w-full py-0!">
        <SectionContainer className="grid grid-cols-2 md:flex items-center justify-between text-foreground md:justify-center gap-8 md:gap-16 xl:gap-28 py-6! md:py-10! text-sm">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            We protect your data.
            <Link href="/security" className="text-brand-link hover:underline">
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
            <li className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
              <CheckIcon className="w-4 h-4" /> ISO 27001{' '}
              <span className="text-foreground-lighter hidden sm:inline">Certified</span>
            </li>
          </ul>
        </SectionContainer>
        <div className="w-full h-px bg-linear-to-r from-transparent via-border to-transparent" />
      </div>
      <SectionContainer className="py-8">
        <div className="xl:grid xl:grid-cols-7 xl:gap-4">
          <div className="xl:col-span-2 flex flex-col gap-8">
            <Link href="#" as="/" className="w-40">
              <SupabaseWordmark className="w-40 h-[30px]" />
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

              <a
                href="https://www.tiktok.com/@supabase.com"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">TikTok</span>
                <IconTikTok size={22} />
              </a>

              <a
                href="https://www.instagram.com/supabasecom"
                className="text-foreground-lighter hover:text-foreground transition"
              >
                <span className="sr-only">Instagram</span>
                <IconInstagram size={22} />
              </a>
            </div>
            <div>
              {newsletterStatus === 'success' ? (
                <div className="flex flex-col gap-1">
                  <p className="text-brand-link text-sm">Thanks for subscribing!</p>
                  <p className="text-foreground-lighter text-xs">
                    You'll hear from us when we publish our next newsletter issue.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                  <p className="text-foreground-lighter text-sm">
                    Get product updates and news from Supabase.
                  </p>
                  <Input_Shadcn_
                    type="email"
                    placeholder="Your email"
                    aria-label="Email for newsletter"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 md:max-w-72 xl:max-w-[80%] h-6! text-xs px-2"
                  />
                  <Button
                    type="primary"
                    size="tiny"
                    htmlType="submit"
                    loading={newsletterStatus === 'loading'}
                    className="w-fit"
                  >
                    Subscribe
                  </Button>
                </form>
              )}
              {newsletterStatus === 'error' && (
                <p className="text-destructive text-sm mt-2">Something went wrong. Try again.</p>
              )}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 xl:col-span-5 xl:mt-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 xl:grid-cols-6">
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
                                <Badge>Coming soon</Badge>
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
