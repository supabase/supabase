import DefaultLayout from '~/components/Layouts/Default'
import { StateOfStartupsHeader } from '~/components/SurveyResults/StateOfStartupsHeader'
import { SurveyChapter } from '~/components/SurveyResults/SurveyChapter'
import { SurveyChapterSection } from '~/components/SurveyResults/SurveyChapterSection'
import { SurveySectionBreak } from '~/components/SurveyResults/SurveySectionBreak'
import pageData from '~/data/surveys/state-of-startups-2025'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useFlag } from 'common'
import { motion } from 'framer-motion'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button, cn } from 'ui'

function StateOfStartupsPage() {
  const router = useRouter()
  const isPageEnabled = useFlag('stateOfStartups')

  const meta_title = pageData.metaTitle || 'State of Startups 2025 | Supabase'
  const meta_description =
    pageData.metaDescription ||
    'We surveyed over 2,000 startup founders and builders to uncover what’s powering modern startups: their stacks, their go-to-market motion, and their approach to AI.'

  const [showFloatingToc, setShowFloatingToc] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [activeChapter, setActiveChapter] = useState(1)
  const tocRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const ctaBannerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (isPageEnabled !== undefined && !isPageEnabled) router.push('/')
  }, [isPageEnabled, router])

  // Scroll detection to show floating ToC
  useEffect(() => {
    const handleScroll = () => {
      const heroElement = heroRef.current
      const ctaBannerElement = ctaBannerRef.current

      if (heroElement && ctaBannerElement) {
        const heroRect = heroElement.getBoundingClientRect()
        const ctaBannerRect = ctaBannerElement.getBoundingClientRect()

        // Show floating ToC when the hero section is completely out of view
        // but hide it when the CTA banner comes into view
        if (heroRect.bottom < 0 && ctaBannerRect.top > window.innerHeight) {
          setShowFloatingToc(true)
        } else {
          setShowFloatingToc(false)
          setIsTocOpen(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Active chapter detection
  useEffect(() => {
    const handleScroll = () => {
      const chapters = pageData.pageChapters
      const scrollY = window.scrollY + 100 // Offset for better detection

      for (let i = chapters.length - 1; i >= 0; i--) {
        const chapterElement = document.getElementById(`chapter-${i + 1}`)
        if (chapterElement && scrollY >= chapterElement.offsetTop) {
          setActiveChapter(i + 1)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close ToC when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideFloating = tocRef.current && !tocRef.current.contains(event.target as Node)

      if (isOutsideFloating) {
        setIsTocOpen(false)
      }
    }

    if (isTocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTocOpen])

  // Floating Table of Contents
  const FloatingTableOfContents = () => {
    const currentChapter = pageData.pageChapters[activeChapter - 1]

    if (!showFloatingToc) return null

    return (
      <div
        ref={tocRef}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
      >
        <div className="relative">
          {/* Closed ToC */}
          <Button
            type="default"
            size="small"
            onClick={() => setIsTocOpen(true)}
            className={cn(
              'flex flex-row gap-2 shadow-xl rounded-full px-2 pr-4',
              isTocOpen && 'hidden'
            )}
          >
            <div className={cn('flex items-center gap-2 font-mono uppercase text-xs')}>
              <span className="bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light">
                {activeChapter}
              </span>
              <motion.span
                key={currentChapter?.shortTitle}
                className="text-foreground tracking-widest"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.1 }}
              >
                {currentChapter?.shortTitle}
              </motion.span>
            </div>
          </Button>

          {/* Open ToC */}
          {isTocOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              className="origin-[50%_25%] bg-background/80 backdrop-blur-lg border border-default rounded-xl shadow-xl overflow-hidden"
            >
              <ol className="max-h-[60vh] overflow-y-auto py-2 flex flex-col">
                {pageData.pageChapters.map((chapter, chapterIndex) => (
                  <motion.li
                    key={chapterIndex + 1}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.1,
                      ease: 'easeOut',
                      delay:
                        0.1 +
                        Math.exp(-(pageData.pageChapters.length - chapterIndex - 1) * 0.3) * 0.2,
                    }}
                  >
                    <Link
                      href={`#chapter-${chapterIndex + 1}`}
                      onClick={() => setIsTocOpen(false)}
                      className={cn(
                        'block px-6 py-2 text-xs transition-colors font-mono uppercase tracking-wider text-center text-foreground-light hover:text-brand-link hover:bg-brand-300/25',
                        chapterIndex + 1 === activeChapter &&
                          'bg-brand-300/40 text-brand-link dark:text-brand'
                      )}
                    >
                      {chapter.shortTitle}
                    </Link>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  if (!isPageEnabled) return null

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/state-of-startups`,
          images: [
            {
              url: `https://supabase.com/images/state-of-startups/state-of-startups-og.png`,
            },
          ],
        }}
      />

      <DefaultLayout className="bg-alternative overflow-hidden">
        <FloatingTableOfContents />
        {/* Intro section */}
        <section ref={heroRef} className="w-full">
          <StateOfStartupsHeader />
          <SurveySectionBreak className="hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-[60rem] mx-auto md:border-x border-muted">
            {/* Intro text */}
            <div className="md:col-span-2 flex flex-col gap-4 px-8 py-10 border-b md:border-b-0 md:border-r border-muted text-foreground text-xl md:text-2xl text-balance">
              <p>{pageData.heroSection.subheader}</p>
              <p>{pageData.heroSection.cta}</p>
            </div>

            {/* Table of contents */}
            <ol className="flex flex-col py-5">
              {pageData.pageChapters.map((chapter, chapterIndex) => (
                <li key={chapterIndex + 1}>
                  <Link
                    href={`#chapter-${chapterIndex + 1}`}
                    className="group flex flex-row gap-5 py-3 pl-7 pr-8 font-mono uppercase tracking-wide text-sm transition-all text-foreground-light hover:text-brand-link hover:bg-brand-300/25"
                  >
                    <span className="text-xs rounded-full bg-surface-75 border border-surface-200 group-hover:border-brand-500/40 w-5 h-5 flex items-center justify-center group-hover:bg-brand-600/5">
                      {chapterIndex + 1}
                    </span>{' '}
                    {chapter.shortTitle}
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <SurveySectionBreak />
        </section>

        {pageData.pageChapters.map((chapter, chapterIndex) => (
          <SurveyChapter
            key={chapterIndex + 1}
            number={chapterIndex + 1}
            shortTitle={chapter.shortTitle}
            title={chapter.title}
            description={chapter.description}
            pullQuote={chapter.pullQuote}
          >
            {chapter.sections.map((section, sectionIndex) => (
              <SurveyChapterSection
                key={sectionIndex + 1}
                title={section.title}
                description={section.description}
                stats={section.stats}
                charts={section.charts}
                wordCloud={section.wordCloud}
                summarizedAnswer={section.summarizedAnswer}
                rankedAnswersPair={section.rankedAnswersPair}
              />
            ))}
          </SurveyChapter>
        ))}
        <CTABanner ref={ctaBannerRef} />
        <ParticipantsList />
      </DefaultLayout>
    </>
  )
}

export default StateOfStartupsPage

// Component for the participants list
const ParticipantsList = () => {
  const [shuffledParticipants, setShuffledParticipants] = useState(pageData.participantsList)

  useEffect(() => {
    // Simple shuffle after mount, no animation because it's at the bottom of the page
    const shuffled = [...pageData.participantsList].sort(() => Math.random() - 0.5)
    setShuffledParticipants(shuffled)
  }, [])

  return (
    <section className="flex flex-col items-center gap-12 md:gap-20 px-4 py-20 md:py-28 text-center border-b border-muted">
      <div className="flex flex-col items-center gap-4 max-w-prose">
        <h2 className="text-foreground text-3xl text-balance">Thank you</h2>
        <p className="text-foreground-light text-lg text-balance max-w-prose">
          A special thanks to the following companies for participating in this year’s survey.
        </p>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-5 md:gap-7 max-w-7xl mx-auto px-4">
        {shuffledParticipants.map((participant, index) => (
          <li key={participant.company} className="">
            <Link
              href={participant.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm font-mono text-center tracking-widest uppercase text-foreground-lighter hover:text-brand-link transition-colors"
            >
              {participant.company}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Component for the 'Builders choose Supabase' CTA at the bottom of the page
const CTABanner = forwardRef<HTMLElement>((props, ref) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  return (
    <section
      className="flex flex-col items-center gap-4 px-4 py-32 text-center border-b border-muted"
      style={{
        background:
          'radial-gradient(circle at center 220%, hsl(var(--brand-400)), transparent 70%)',
      }}
      ref={ref}
    >
      <div className="flex flex-col items-center gap-4 max-w-prose">
        <h2 className="text-foreground text-5xl text-balance">Builders choose Supabase</h2>
        <p className="text-foreground-light text-lg">
          Supabase is the Postgres development platform. Build your startup with a Postgres
          database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, Storage,
          and Vector embeddings.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button asChild size="medium">
          <Link
            href="https://supabase.com/dashboard"
            onClick={() =>
              sendTelemetryEvent({
                action: 'start_project_button_clicked',
                properties: { buttonLocation: 'CTA Banner' },
              })
            }
          >
            Start your project
          </Link>
        </Button>
        <Button asChild size="medium" type="default">
          <Link
            href="/contact/sales"
            onClick={() =>
              sendTelemetryEvent({
                action: 'request_demo_button_clicked',
                properties: { buttonLocation: 'CTA Banner' },
              })
            }
          >
            Request a demo
          </Link>
        </Button>
      </div>
    </section>
  )
})

CTABanner.displayName = 'CTABanner'
