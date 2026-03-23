'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Button, cn } from 'ui'

const customerStories = [
  {
    name: 'Resend',
    logo: '/images/customers/logos/resend.png',
    icon: '/images/customers/logos/resend-icon.svg',
    tagline: 'Scaling seamlessly to 5,000+ paying customers and millions of emails sent daily.',
    quote:
      "The Supabase YC Program made it a no-brainer for us. We didn't have to worry about backend costs in the early days, which gave us more runway to focus on product-market fit.",
    author: 'Zeno Rocha, CEO, Resend',
    authorImg: '/images/blog/avatars/zeno-rocha.png',
    slug: 'resend',
    bgColor: '#000000',
    bgGradient: 'linear-gradient(to bottom left, #0a0a0a 0%, #000000 100%)',
    dimBgColor: '#080808',
    textColor: 'light' as 'light' | 'dark',
  },
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
    bgColor: '#7a3818',
    bgGradient: 'linear-gradient(to bottom left, #7a3818 0%, #4a1e08 100%)',
    dimBgColor: '#5a2a10',
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
    bgColor: '#7a4400',
    bgGradient: 'linear-gradient(to bottom left, #7a4400 0%, #4a2800 100%)',
    dimBgColor: '#5a3200',
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

const aiBuilderStories = [
  {
    name: 'Lovable',
    logo: '/images/logos/publicity/lovable.svg',
    description:
      'We store embeddings in a PostgreSQL database. Supabase is a great partner for us as we scale.',
    slug: 'lovable',
    photo: '/images/logos/publicity/lovable-team.png',
  },
  {
    name: 'Bolt',
    logo: '/images/logos/publicity/bolt.svg',
    description: 'We store embeddings in a PostgreSQL database, hosted by Supabase.',
    slug: 'bolt',
    photo: '/images/logos/publicity/bolt-team.png',
  },
]

function LovableLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 121 122" fill="none" className={className}>
      <path
        fill="white"
        fillRule="evenodd"
        d="M36.069 0c19.92 0 36.068 16.155 36.068 36.084v13.713h12.004c19.92 0 36.069 16.156 36.069 36.084 0 19.928-16.149 36.083-36.069 36.083H0v-85.88C0 16.155 16.148 0 36.069 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconChip({
  story,
  size = 'md',
}: {
  story: (typeof customerStories)[0]
  size?: 'sm' | 'md'
}) {
  const isLight = story.textColor === 'light'
  const s = story as any
  const filter = s.iconFilter ?? (s.rawIcon ? undefined : isLight ? 'brightness(0) invert(1)' : 'brightness(0)')
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
    <div className="py-24 flex flex-col gap-16 border-b border-border">
      {/* Header row */}
      <div className="">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
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
        </div>
      </div>

      {/* Cards row */}
      <div className="px-6 mx-auto max-w-[var(--container-max-w,75rem)] w-full">
        {/* Mobile: stacked cards */}
        <div className="flex flex-col gap-2 md:hidden">
          {customerStories.map((story, index) => {
            const isActive = index === activeIdx
            const isDark = story.textColor === 'dark'
            return (
              <button
                key={story.slug}
                onClick={() => setActiveIdx(index)}
                className="text-left rounded-lg p-5 flex flex-col gap-4 overflow-hidden transition-opacity"
                style={{ background: isActive ? story.bgGradient : story.dimBgColor }}
              >
                <IconChip story={story} size="sm" />
                {isActive && (
                  <div className="flex flex-col gap-3 flex-1">
                    <div>
                      <p className="text-sm font-medium" style={{ color: isDark ? '#111' : 'white' }}>
                        {story.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.6)' }}>
                        {story.tagline}
                      </p>
                    </div>
                    <p
                      className="text-xl font-normal leading-relaxed text-pretty"
                      style={{ color: isDark ? '#222' : 'white' }}
                    >
                      "{story.quote}"
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <img src={story.authorImg} alt={story.author} className="h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-white/30" />
                      <p className="text-xs" style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.65)' }}>
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
              </button>
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
              <motion.button
                layout
                key={story.slug}
                onClick={() => setActiveIdx(index)}
                className="text-left flex flex-col items-start gap-8 overflow-hidden transition-opacity hover:opacity-90"
                style={{
                  background: isActive ? story.bgGradient : story.dimBgColor,
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
                  className="flex flex-col gap-1.5 flex-1 w-[30rem]"
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
                >
                  {/* Top: company name + tagline */}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium" style={{ color: isDark ? '#111' : 'white' }}>
                      {story.name}
                    </p>
                    <p
                      className="text-xs leading-relaxed text-pretty"
                      style={{ color: isDark ? '#888' : 'rgba(255,255,255,0.6)' }}
                    >
                      {story.tagline}
                    </p>
                  </div>

                  {/* Bottom: quote + author */}
                  <div className="flex flex-col gap-4 mt-auto">
                    <p
                      className="text-xl font-normal leading-relaxed text-pretty"
                      style={{ color: isDark ? '#222' : 'white' }}
                    >
                      "{story.quote}"
                    </p>
                    <div className="flex items-center gap-2.5 mb-4">
                      <img
                        src={story.authorImg}
                        alt={story.author}
                        className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-white/30"
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
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* AI Builder stories */}
      <div className="mt-10">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
            <div className="flex flex-col md:min-h-[320px] gap-4 justify-between">
              <h3 className="text-xl md:text-3xl text-foreground-lighter">
                Powering the next wave
                <br />
                <span className="text-foreground">of AI builders</span>
              </h3>
              <p className="text-sm text-foreground-lighter leading-relaxed text-pretty max-w-sm">
                Create full backend experiences in behalf of your users with Supabase for Platforms,
                the all-in-one solution for building AI-native platforms and marketplaces.
              </p>

              <Button type="default" size="medium" asChild className="w-fit mt-auto">
                <Link href="/partners/integrations">Explore Supabase for Platforms</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aiBuilderStories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/customers/${story.slug}`}
                  className="group relative overflow-hidden rounded-lg w-full aspect-video border border-white/10 flex flex-col justify-end p-5"
                >
                  {/* Photo background */}
                  <img
                    src={story.photo}
                    alt={story.name}
                    className="absolute inset-0 w-full h-full object-cover select-none scale-[1.015]"
                  />
                  {/* Dark gradient overlay — heavier at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Logo + description at bottom */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <img
                      src={story.logo}
                      alt={story.name}
                      className="h-6 w-auto object-contain object-left brightness-0 invert select-none"
                    />
                    <p className="text-white/75 text-sm leading-relaxed text-pretty">
                      {story.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Builder logo strip — full width below */}
          <div className="mt-8 pt-6 border-t border-muted flex flex-wrap items-center gap-x-8 gap-y-4">
            {[
              { name: 'Lovable', logo: '/images/logos/publicity/lovable.svg' },
              { name: 'Figma', logo: '/images/logos/publicity/figma.svg' },
              { name: 'v0', logo: '/images/logos/publicity/v0.svg' },
              { name: 'Bolt', logo: '/images/logos/publicity/bolt.svg' },
              { name: 'Tempo', logo: '/images/logos/publicity/tempo.svg' },
              { name: 'Gumloop', logo: '/images/logos/publicity/gumloop.svg' },
              { name: 'Pika', logo: '/images/logos/publicity/pika.svg' },
              { name: 'Udio', logo: '/images/logos/publicity/udio.svg' },
            ].map((b) => (
              <img
                key={b.name}
                src={b.logo}
                alt={b.name}
                className="h-5 w-auto object-contain opacity-40 brightness-0 invert"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
