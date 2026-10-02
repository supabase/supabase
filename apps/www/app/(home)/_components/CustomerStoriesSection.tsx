'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from 'ui'

import SectionContainer from '@/components/Layouts/SectionContainer'

const customerStories = [
  {
    name: 'Lovable',
    icon: '/images/customers/logos/lovable-homepage-icon.svg',
    tagline: 'Powering millions of AI-generated apps with a complete Supabase backend.',
    quote:
      'Lovable is about unlocking creativity for anyone. Only 1% of the population knows how to code. Lovable has unlocked that ability for the other 99%.',
    author: 'Bryan Byrne, Product Manager, Lovable',
    authorImg: '/images/blog/avatars/bryan-byrne-lovable.jpeg',
    slug: 'lovable',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    bgColor: '#FD49A8',
    bgGradient:
      'linear-gradient(to bottom, #FD49A8 0%, #FD2980 10%, #FC1A58 20%, #FA1F41 30%, #FA2733 40%, #FB3D26 50%, #FC541F 60%, #FE6A1E 70%, #FE771D 80%, #FF861B 90%, #FF8F1B 100%)',
    dimBgColor: '#FD2980',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'eXp Realty',
    icon: '/images/customers/logos/exprealty-homepage-icon.svg',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    iconScale: 1.35,
    tagline: 'Empowering 2,000+ employees to build production software with AI.',
    quote:
      "The thing that makes everything possible, all of our rapid development now and AI-generated or assisted development, is Supabase. That's the giant whose shoulders we can stand on.",
    author: 'Seth Siegler, Chief Innovation Officer, eXp Realty',
    authorImg: '/images/blog/avatars/seth-siegler.jpg',
    slug: 'exprealty',
    bgColor: '#0c0f24',
    bgGradient: '#0c0f24',
    dimBgColor: '#0c0f24',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'Phoenix Energy',
    icon: '/images/customers/logos/phoenix-energy-homepage-icon.svg',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    tagline: 'Migrated critical infrastructure from MongoDB with zero downtime.',
    quote:
      'We needed a system that could handle serious performance and security requirements — without slowing down our developers. Supabase has given us both.',
    author: 'Kris Woods, CTO, Phoenix Energy',
    authorImg: '/images/blog/avatars/kris-woods-phoenix-energy.jpg',
    slug: 'phoenix-energy',
    bgColor: '#002533',
    bgGradient: '#002533',
    dimBgColor: '#002533',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'Chatbase',
    icon: '/images/customers/logos/chatbase-homepage-icon.svg',
    tagline: 'Scaled from zero to $10M ARR on a single Postgres-backed platform.',
    quote:
      "Instead of splitting things out as we go, we try to consolidate things more as we do. The technology itself works better when you have things that are closely tied together. That's why we're on Supabase.",
    author: 'Yasser Elsaid, Founder and CEO, Chatbase',
    authorImg: '/images/blog/avatars/yasser-elsaid-chatbase.jpeg',
    slug: 'chatbase',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    bgColor: '#000000',
    bgGradient: '#000000',
    dimBgColor: '#000000',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'Rally',
    icon: '/images/customers/logos/rally-icon.svg',
    rawIcon: true,
    tagline: 'From first line of code to fully licensed fintech in three months.',
    quote:
      "We could not have built this company without Supabase. If I had to go and build all these components myself, we wouldn't even have launched.",
    author: 'Thiago Peres, Founder & CTO, Rally',
    authorImg: '/images/blog/avatars/thiago-peres-rally.jpeg',
    slug: 'rally',
    bgColor: 'color(display-p3 0.275 0.306 0.8)',
    bgGradient:
      'linear-gradient(to bottom left, color(display-p3 0.275 0.306 0.8 / 1) 0%, color(display-p3 0.118 0.176 0.769 / 1) 100%)',
    dimBgColor: 'color(display-p3 0.118 0.176 0.769 / 1)',
    textColor: 'light' as 'light' | 'dark',
  },
]

function IconChip({
  story,
  size = 'md',
}: {
  story: (typeof customerStories)[0]
  size?: 'sm' | 'md'
}) {
  const isLight = story.textColor === 'light'
  const s = story as any
  const filter =
    s.iconFilter ?? (s.rawIcon ? undefined : isLight ? 'brightness(0) invert(1)' : 'brightness(0)')
  return (
    <img
      src={story.icon}
      alt={story.name}
      className={cn('object-contain shrink-0', size === 'md' ? 'h-8 w-8' : 'h-6 w-6')}
      style={{
        filter,
        transform: s.iconScale ? `scale(${s.iconScale})` : undefined,
      }}
    />
  )
}

// Change INACTIVE_PAD to adjust closed column width automatically
const INACTIVE_PAD = 22 // px padding on each side of icon in closed columns
const ACTIVE_PAD = 32 // px padding on each side when card is open
const ICON_PX = 32 // w-8 = 32px
const INACTIVE_COL_WIDTH = INACTIVE_PAD * 2 + ICON_PX // = 76px

export function CustomerStoriesSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = customerStories[activeIdx]

  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header row */}
      <SectionContainer className="py-0!">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            How industry leaders <br />{' '}
            <span className="text-foreground">are building with Supabase</span>
          </h3>
          <Link
            href="/customers"
            className="text-sm text-foreground-light hover:text-foreground underline"
          >
            More customer stories
          </Link>
        </div>
      </SectionContainer>

      {/* Cards row */}
      <SectionContainer className="py-0!">
        {/* Mobile: stacked cards */}
        <div className="flex flex-col gap-2 lg:hidden">
          {customerStories.map((story, index) => {
            const isActive = index === activeIdx
            const isDark = story.textColor === 'dark'
            return (
              <div
                key={story.slug}
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={story.name}
                onClick={() => setActiveIdx(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveIdx(index)
                  }
                }}
                className="text-left rounded-lg p-5 flex flex-col gap-4 overflow-hidden transition-opacity cursor-pointer"
                style={{ background: isActive ? story.bgGradient : story.dimBgColor }}
              >
                <IconChip story={story} size="sm" />
                {isActive && (
                  <div className="flex flex-col gap-3 flex-1">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: isDark ? '#111' : 'white' }}
                      >
                        {story.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.6)' }}
                      >
                        {story.tagline}
                      </p>
                    </div>
                    <p
                      className="text-xl font-normal leading-snug text-pretty"
                      style={{
                        color: isDark ? '#222' : 'white',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {story.quote}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={story.authorImg}
                        alt={story.author}
                        className="h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-white/30"
                      />
                      <p
                        className="text-xs"
                        style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.65)' }}
                      >
                        {story.author}
                      </p>
                    </div>
                    <Link
                      href={`/customers/${story.slug}`}
                      className="text-xs underline"
                      style={{ color: isDark ? '#555' : 'rgba(255,255,255,0.7)' }}
                    >
                      Read the story →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop: animated accordion grid */}
        <div
          className="hidden lg:grid min-h-[480px] gap-2"
          style={{
            gridTemplateColumns: customerStories
              .map((_, i) => (i === activeIdx ? '1fr' : `${INACTIVE_COL_WIDTH}px`))
              .join(' '),
          }}
        >
          {customerStories.map((story, index) => {
            const isActive = index === activeIdx
            const isDark = story.textColor === 'dark'
            return (
              <motion.div
                layout
                key={story.slug}
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={story.name}
                onClick={() => setActiveIdx(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveIdx(index)
                  }
                }}
                className="text-left flex flex-col items-start gap-8 overflow-hidden cursor-pointer"
                style={{
                  background: story.bgGradient,
                  borderRadius: 8,
                  padding: isActive ? ACTIVE_PAD : `${ACTIVE_PAD}px ${INACTIVE_PAD}px`,
                  boxShadow: isDark
                    ? 'inset 0 0 0 1px rgba(0,0,0,0.07)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
              >
                <motion.div layout>
                  <IconChip story={story} />
                </motion.div>

                <motion.div
                  layout
                  className="flex flex-col gap-1.5 flex-1 w-[35rem]"
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    filter: isActive ? 'blur(0px)' : 'blur(2px)',
                  }}
                  transition={{
                    duration: 0.42,
                    ease: [0.165, 0.84, 0.44, 1],
                    delay: isActive ? 0.2 : 0,
                  }}
                  aria-hidden={!isActive}
                  {...(!isActive ? { inert: true } : {})}
                >
                  {/* Top: company name + tagline */}
                  <motion.div layout className="flex flex-col gap-1">
                    <motion.p
                      layout
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#111' : 'white' }}
                    >
                      {story.name}
                    </motion.p>
                    <motion.p
                      layout
                      className="text-xs leading-relaxed text-pretty"
                      style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.6)' }}
                    >
                      {story.tagline}
                    </motion.p>
                  </motion.div>

                  {/* Bottom: quote + author */}
                  <motion.div layout className="flex flex-col gap-4 mt-auto">
                    <motion.p
                      layout
                      className="text-2xl font-normal leading-snug text-balance"
                      style={{
                        color: isDark ? '#222' : 'white',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {story.quote}
                    </motion.p>
                    <motion.div layout className="flex items-center gap-2.5 mb-4">
                      <img
                        src={story.authorImg}
                        alt={story.author}
                        className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-white/30"
                      />
                      <motion.p
                        layout
                        className="text-xs"
                        style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.65)' }}
                      >
                        {story.author}
                      </motion.p>
                    </motion.div>
                    <Link
                      href={`/customers/${story.slug}`}
                      className="text-xs underline"
                      style={{ color: isDark ? '#555' : 'rgba(255,255,255,0.7)' }}
                    >
                      Read the story →
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </SectionContainer>
    </div>
  )
}
