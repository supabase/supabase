'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from 'ui'

const customerStories = [
  {
    name: 'Hyper',
    logo: '/images/customers/logos/hyper.svg',
    description:
      'We store embeddings in a PostgreSQL database, hosted by Supabase, to perform a similarity search to identify the most relevant sections within the MDN.',
    author: 'Hermina Condei, Director at MDN, Mozilla',
    slug: 'mozilla-mdn',
  },
  {
    name: 'Mobbin',
    logo: '/images/customers/logos/mobbin.png',
    description:
      'Mobbin helps over 200,000 creators globally search and view the latest design patterns from well-known apps.',
    author: 'Anselm Bild, Co-Founder',
    slug: 'mobbin',
  },
  {
    name: 'Chatbase',
    logo: '/images/customers/logos/chatbase.png',
    description:
      'How Yasser leveraged Supabase to build Chatbase and became one of the most successful single-founder AI products.',
    author: 'Yasser Elsaid, Founder',
    slug: 'chatbase',
  },
  {
    name: 'Markprompt',
    logo: '/images/customers/logos/markprompt.png',
    description:
      'Having access to the full features of Postgres, colocated with the embeddings, makes it the perfect vector database.',
    author: 'Michael Fester, Co-Founder, Markprompt',
    slug: 'markprompt',
  },
  {
    name: 'Resend',
    logo: '/images/customers/logos/resend.png',
    description:
      'Supabase gave us a complete backend with auth, database and storage so we could focus on our core product.',
    author: 'Zeno Rocha, CEO, Resend',
    slug: 'resend',
  },
]

const aiBuilderStories = [
  {
    name: 'Bolt',
    logo: '/images/logos/publicity/bolt.svg',
    description:
      'We store embeddings in a PostgreSQL database, hosted by Supabase, to perform a similarity search to identify',
    slug: 'bolt',
    gradient: 'linear-gradient(to top, #0a1a3a 0%, #1a3f6f 30%, #2563eb 65%, #60a5fa 100%)',
  },
  {
    name: 'Lovable',
    logo: '/images/logos/publicity/lovable.svg',
    description:
      'We store embeddings in a PostgreSQL database, hosted by Supabase, to perform a similarity search to identify',
    slug: 'lovable',
    gradient:
      'linear-gradient(160deg, #c4b5fd 0%, #a78bfa 20%, #ec4899 50%, #fb7185 75%, #ef4444 100%)',
  },
]

export function CustomerStoriesSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = customerStories[activeIdx]

  return (
    <div>
      {/* Header row */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border">
          <div className="flex items-center justify-between py-8">
            <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
              How industry leaders <br />{' '}
              <span className="text-foreground">are building with Supabase</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] border-x border-border">
          <div className="flex min-h-[380px]">
            {customerStories.map((story, index) => {
              const isActive = index === activeIdx
              return (
                <motion.button
                  key={story.slug}
                  onClick={() => setActiveIdx(index)}
                  className={cn(
                    'text-left border-r border-border last:border-r-0 p-5 flex flex-col gap-3 overflow-hidden',
                    isActive ? 'bg-surface-75' : 'items-center hover:bg-surface-75/50'
                  )}
                  animate={{ flex: isActive ? '0 0 50%' : '1 1 0%' }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
                >
                  <img
                    src={story.logo}
                    alt={story.name}
                    className="size-16 rounded object-contain shrink-0"
                  />

                  <AnimatePresence mode="popLayout">
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.1 } }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="flex flex-col gap-1.5 mt-1 flex-1 min-w-[280px]"
                      >
                        <p className="text-foreground text-sm font-medium">{story.name}</p>
                        <p className="text-foreground-lighter text-sm leading-relaxed">
                          {story.description}
                        </p>
                        <p className="text-foreground-muted text-xs mt-1">{story.author}</p>
                        <Link
                          href={`/customers/${story.slug}`}
                          className="text-sm text-foreground-light hover:text-foreground underline mt-auto"
                        >
                          View more about {story.name}
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer row */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border">
          <div className="flex items-center justify-between py-4">
            <p className="text-sm text-foreground-lighter">Powering the worlds best brands</p>
            <Link
              href="/customers"
              className="text-sm text-foreground-light hover:text-foreground underline"
            >
              More customer stories
            </Link>
          </div>
        </div>
      </div>

      {/* AI Builder stories */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-32 py-12">
            <div className="flex items-start">
              <h3 className="text-2xl md:text-4xl text-foreground-lighter">
                Learn about
                <br />
                AI Builder stories
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {aiBuilderStories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/customers/${story.slug}`}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] flex items-center justify-center"
                  style={{ background: story.gradient }}
                >
                  <img
                    src={story.logo}
                    alt={story.name}
                    className="h-8 w-auto object-contain brightness-0 invert relative z-10 select-none"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium mb-1">{story.name}</p>
                    <p className="text-white/70 text-xs leading-relaxed">{story.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
