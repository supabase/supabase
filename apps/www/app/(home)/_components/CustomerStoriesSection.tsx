'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from 'ui'

import SectionContainer from '@/components/Layouts/SectionContainer'

const customerStories = [
  {
    name: 'Firecrawl',
    logo: '/images/customers/logos/firecrawl.png',
    icon: '/images/customers/logos/firecrawl-icon.svg',
    tagline: 'Switched from Pinecone to Supabase Vector to boost efficiency and accuracy.',
    quote:
      "We looked at the alternatives and chose Supabase because it's open source, it's simpler, and for all the ways we need to use it, Supabase has been just as performant — if not more performant — than the other vector databases.",
    author: 'Caleb Peffer, CEO, Firecrawl',
    authorImg: '/images/blog/avatars/caleb-peffer.jpg',
    slug: 'firecrawl',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    bgColor: 'color(display-p3 0.980392 0.364706 0.098039)',
    bgGradient:
      'linear-gradient(to bottom left, color(display-p3 0.980392 0.364706 0.098039 / 1) 0%, color(display-p3 0.980392 0.364706 0.098039 / 0.9) 100%)',
    dimBgColor: 'color(display-p3 0.980392 0.364706 0.098039 / 0.9)',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'Rally',
    logo: '/images/customers/logos/rally.png',
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
  {
    name: 'Hyper',
    logo: '/images/customers/logos/hyper.svg',
    icon: '/images/customers/logos/hyper-icon.svg',
    tagline: 'An AI-native marketing platform with agents that operate across the entire workflow.',
    quote:
      'I will get on a podcast and talk about how much I love Supabase. With Supabase we can move fast and build things that delight our customers without having to worry about infrastructure.',
    author: 'Elliot Fleck, Co-founder, Hyper',
    authorImg: '/images/blog/avatars/elliot-fleck-hyper.jpeg',
    slug: 'hyper',
    bgColor: '#222222',
    bgGradient: 'linear-gradient(to bottom left, #2a2a2a 0%, #181818 100%)',
    dimBgColor: '#1e1e1e',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'E2B',
    logo: '/images/customers/logos/e2b.png',
    icon: '/images/customers/logos/e2b-icon.svg',
    tagline: 'Secure, scalable execution of AI-generated code in the cloud.',
    quote:
      "Supabase empowers us to focus on innovation rather than infrastructure. It's the backbone of our platform, enabling scalability and seamless developer experiences.",
    author: 'Vasek Mlejnsky, CEO, E2B',
    authorImg: '/images/blog/avatars/vasek-mlejnsky.jpg',
    slug: 'e2b',
    rawIcon: true,
    iconFilter: 'brightness(0) invert(1)',
    bgColor: 'color(display-p3 1 0.533 0)',
    bgGradient:
      'linear-gradient(to bottom left, color(display-p3 1 0.533 0 / 1) 0%, color(display-p3 0.7 0.373 0 / 1) 100%)',
    dimBgColor: 'color(display-p3 0.7 0.373 0 / 1)',
    textColor: 'light' as 'light' | 'dark',
  },
  {
    name: 'Mobbin',
    logo: '/images/customers/logos/mobbin.png',
    icon: '/images/customers/logos/mobbin-icon.svg',
    tagline: 'Migrated 200,000 users from Firebase for a better authentication experience.',
    quote:
      'Migrating to Supabase meant that we could instantly fix our Auth problems and save money. Just being on Supabase alone gives us confidence we can deliver on whatever users need in the future.',
    author: 'Jian Jie Liau, Co-founder & CTO, Mobbin',
    authorImg: '/images/blog/avatars/jian-mobbin.jpg',
    slug: 'mobbin',
    bgColor: '#000000',
    bgGradient: 'linear-gradient(to bottom left, #0a0a0a 0%, #000000 100%)',
    dimBgColor: '#080808',
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
      style={filter ? { filter } : undefined}
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
        <div className="flex flex-col gap-2 md:hidden">
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
          className="hidden md:grid min-h-[480px] gap-2"
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
