import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { NextSeo } from 'next-seo'

import { Button, Checkbox, cn, Card, CardHeader, CardTitle, CardContent } from 'ui'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { SurveySectionBreak } from '~/components/SurveyResults/SurveySectionBreak'

import data from '~/data/surveys/state-of-startups-2025'

import { SurveyChapter } from '~/components/SurveyResults/SurveyChapter'
import { SurveyChapterSection } from '~/components/SurveyResults/SurveyChapterSection'

function StateOfStartupsPage() {
  const pageData = data()
  const [showFloatingToc, setShowFloatingToc] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [activeChapter, setActiveChapter] = useState(1)
  const tocRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  // Scroll detection to show floating ToC
  useEffect(() => {
    const handleScroll = () => {
      const heroElement = heroRef.current

      if (heroElement) {
        const heroRect = heroElement.getBoundingClientRect()

        // Show floating ToC when the hero section is completely out of view
        if (heroRect.bottom < 0) {
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
  }, [pageData.pageChapters])

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
                        'block px-6 py-2 text-xs transition-colors font-mono uppercase tracking-widest text-center text-foreground-light hover:text-brand-link hover:bg-brand-300/25',
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

  return (
    <>
      {/* <NextSeo {...pageData.seo} /> */}
      <DefaultLayout className="bg-alternative overflow-hidden">
        <FloatingTableOfContents />
        {/* Intro section */}
        <section ref={heroRef} className="w-full">
          {/* Text contents */}
          <header className="w-full flex flex-col md:flex-col">
            <div className="flex flex-col md:flex-row">
              {/* Left side - spans from left edge to end of second grid column */}
              <div
                style={
                  {
                    '--left-width': 'calc((50% - 60rem / 2) + (60rem * 1/3))',
                  } as React.CSSProperties
                }
                className="border-b md:border-b-0 md:border-r border-muted border-opacity-50 md:text-right flex-1 md:max-w-[var(--left-width)]"
              >
                {/* Decorative progress bar */}
                <div aria-hidden="true" className="flex flex-col">
                  {[0, 1, 2, 3].map((item, index) => (
                    <div
                      key={index}
                      className={`h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-brand' : index === 1 ? 'bg-brand-500' : 'bg-brand-300'}`}
                      style={{
                        maskImage: 'url("/survey/pattern-front.svg")',
                        maskSize: '14.5px 15px',
                        maskRepeat: 'repeat',
                        maskPosition: 'top left',
                      }}
                    />
                  ))}
                </div>
                <p className="text-brand-link text-sm font-mono uppercase py-4 px-8">
                  Supabase presents the 2025
                </p>
              </div>

              {/* Right side - takes up remaining space */}
              <div
                className="px-8 py-12 md:pt-36 pb-28 flex-1"
                style={{
                  background: `radial-gradient(ellipse at 5% -40%, hsl(var(--brand-500)), transparent 65%), radial-gradient(ellipse at 85% 230%, hsl(var(--background-surface-200)), transparent 75%)`,
                }}
              >
                <h1 className="text-7xl sm:text-8xl lg:text-9xl tracking-tight">
                  State of
                  <br /> Startups
                </h1>
              </div>
            </div>
            <SurveySectionBreak />

            <div className="grid grid-cols-1 md:grid-cols-3 max-w-[60rem] mx-auto border-x border-muted">
              {/* Intro text */}
              <div className="md:col-span-2 flex flex-col gap-4 px-8 py-10 border-b md:border-b-0 md:border-r border-muted text-foreground md:text-2xl">
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
          </header>

          <SurveySectionBreak />
        </section>

        {pageData.pageChapters.map((chapter, chapterIndex) => (
          <>
            <SurveyChapter
              key={chapterIndex + 1}
              number={chapterIndex + 1}
              totalChapters={pageData.pageChapters.length}
              shortTitle={chapter.shortTitle}
              title={chapter.title}
              description={chapter.description}
              pullQuote={chapter.pullQuote}
            >
              {chapter.sections.map((section, sectionIndex) => (
                <SurveyChapterSection
                  key={sectionIndex + 1}
                  number={`${chapterIndex + 1}.${sectionIndex + 1}`}
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
          </>
        ))}
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default StateOfStartupsPage

const CTABanner = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  return (
    <section
      className="flex flex-col items-center gap-4 py-32 text-center border-b border-muted"
      style={{
        background:
          'radial-gradient(circle at center 280%, hsl(var(--brand-500)), transparent 70%)',
      }}
    >
      <div className="flex flex-col items-center gap-4 max-w-prose">
        <h2 className="text-foreground-light text-5xl text-balance">
          The majority of builders <span className="text-foreground">choose Supabase</span>
        </h2>
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
}
