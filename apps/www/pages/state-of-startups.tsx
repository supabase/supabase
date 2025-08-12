import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { animate, createSpring, createTimeline, stagger } from 'animejs'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { Maximize2, X } from 'lucide-react'

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
      const scrollY = window.scrollY
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

  // Floating Table of Contents component
  const FloatingTableOfContents = () => {
    const currentChapter = pageData.pageChapters[activeChapter - 1]

    if (!showFloatingToc) return null

    return (
      <div
        ref={tocRef}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
      >
        <div className="relative">
          {/* Closed state - shows current chapter */}
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
              {/* <motion.span
                className="bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.1 }}
              >
                {activeChapter}
              </motion.span> */}
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

          {/* Open state - shows full table of contents */}
          {isTocOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              className="origin-[50%_25%] bg-background/75 backdrop-blur-lg border border-default rounded-xl shadow-xl overflow-hidden min-w-[280px]"
            >
              <ol className="max-h-[60vh] overflow-y-auto p-1 flex flex-col gap-1">
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
                        'block py-2 rounded-lg text-sm transition-colors text-balance text-center',
                        chapterIndex + 1 === activeChapter
                          ? 'bg-brand/10 text-brand-link dark:text-brand'
                          : 'text-foreground-light hover:text-foreground hover:bg-surface-300'
                      )}
                    >
                      {chapter.title}
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

  // Inline Table of Contents component (expanded only)
  const InlineTableOfContents = () => {
    return (
      <div className="">
        <ol className="p-1 flex flex-col gap-1">
          {pageData.pageChapters.map((chapter, chapterIndex) => (
            <li key={chapterIndex + 1}>
              <Link
                href={`#chapter-${chapterIndex + 1}`}
                className="block py-2 rounded-lg text-sm transition-colors text-balance text-foreground-light hover:text-foreground hover:bg-surface-300"
              >
                {chapter.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <>
      {/* <NextSeo {...pageData.seo} /> */}
      <DefaultLayout className="bg-alternative overflow-hidden">
        {/* Floating version */}
        <FloatingTableOfContents />

        {/* Previously <Hero /> */}
        <section ref={heroRef} className="relative w-full">
          {/* Text container */}
          <header className="container w-full flex flex-col md:flex-col px-4 pb-16 mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left side */}
              <div>
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
                <p className="text-brand-link text-sm font-mono uppercase ">
                  Supabase presents the 2025
                </p>
              </div>

              {/* Right side */}
              <div
                className=""
                style={{
                  background: `radial-gradient(ellipse at 5% -40%, hsl(var(--brand-500)), transparent 65%), radial-gradient(ellipse at 85% 230%, hsl(var(--background-surface-200)), transparent 75%)`,
                  // background:
                  // 'linear-gradient(217deg, rgb(255 0 0 / 0.8), transparent 70.71%), linear-gradient(127deg, rgb(0 255 0 / 0.8), transparent 70.71%), linear-gradient(336deg, rgb(0 0 255 / 0.8), transparent 70.71%)',
                }}
              >
                <h1 className="!leading-[90%] tracking-[-0.025em] text-7xl md:text-[14vw] lg:text-[12vw] xl:text-[10vw]">
                  State of
                  <br /> Startups
                </h1>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-4 max-w-prose">
                <p className="p md:text-2xl">{pageData.heroSection.subheader}</p>
                <p className="p md:text-2xl">{pageData.heroSection.cta}</p>
              </div>

              {/* Inline version - always expanded */}
              <div className="relative flex justify-center mb-4">
                <InlineTableOfContents />
              </div>
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
                  // pullQuote={section.pullQuote}
                />
              ))}
            </SurveyChapter>
          </>
        ))}
      </DefaultLayout>
    </>
  )
}

export default StateOfStartupsPage
