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
      <div className="bg-background/75 backdrop-blur-lg border border-default rounded-xl shadow-xl overflow-hidden min-w-[280px]">
        <ol className="max-h-[60vh] overflow-y-auto p-1 flex flex-col gap-1">
          {pageData.pageChapters.map((chapter, chapterIndex) => (
            <li key={chapterIndex + 1}>
              <Link
                href={`#chapter-${chapterIndex + 1}`}
                className="block py-2 rounded-lg text-sm transition-colors text-balance text-center text-foreground-light hover:text-foreground hover:bg-surface-300"
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
      <DefaultLayout className="!bg-alternative overflow-hidden">
        {/* Floating version */}
        <FloatingTableOfContents />

        {/* Previously <Hero /> */}
        <section ref={heroRef} className="relative w-full">
          {/* SVG shapes container */}
          <div className="absolute inset-0 -top-[30rem] xs:w-[calc(100%+50vw)] xs:-mx-[25vw]">
            <svg
              width="558"
              height="392"
              viewBox="0 0 558 392"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute w-full h-full inset-0 -top-40 animate-pulse"
              style={{
                animationDuration: '20000ms',
              }}
            >
              <circle
                cx="278.831"
                cy="112.952"
                r="278.5"
                transform="rotate(75 278.831 112.952)"
                fill="url(#paint0_radial_183_1691)"
                fillOpacity="0.2"
              />
              <defs>
                <radialGradient
                  id="paint0_radial_183_1691"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(349.764 247.245) rotate(47.821) scale(202.74 202.839)"
                >
                  <stop stopColor="hsl(var(--brand-200))" />
                  <stop offset="1" stopColor="hsl(var(--brand-200))" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
            {/* <div className="sm:w-full sm_h-full sm:flex sm:justify-center"></div> */}
            <div className="w-full h-full flex justify-center">
              <svg
                width="1119"
                height="1119"
                viewBox="0 0 1119 1119"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                // className="sm:w-auto -mb-72 sm:-mt-60 md:-mt-40 lg:-mt-12 xl:mt-0 animate-spinner !ease-linear transform"
                className="animate-spinner !ease-linear transform"
                style={{
                  animationDuration: '20000ms',
                }}
              >
                <g clipPath="url(#clip0_183_1690)">
                  <circle cx="559.5" cy="559.5" r="496" fill="url(#paint1_radial_183_1690)" />
                  <path
                    d="M982.759 -15.7995C1100.79 61.9162 1134.95 153.728 1129.8 236.892C1124.68 319.611 1080.66 393.869 1041.31 437.283C968.75 168.701 692.591 9.3387 423.687 80.9161C430.529 20.4699 450.367 -27.8768 480.826 -63.4144C511.422 -99.1129 552.763 -121.922 602.496 -131.075C701.21 -149.241 833.009 -113.601 979.3 -18.0675L982.759 -15.7995Z"
                    stroke="url(#paint2_radial_183_1690)"
                    strokeWidth="1.15887"
                  />
                </g>
                <defs>
                  <radialGradient
                    id="paint1_radial_183_1690"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(571.212 539.13) rotate(-57.818) scale(542.117 690.275)"
                  >
                    {/* Inner core */}
                    <stop stopColor="hsl(var(--brand-200))" />
                    {/* Inner band */}
                    <stop offset="0.675" stopColor="hsl(var(--brand-200))" />
                    {/* Outer band */}
                    <stop offset="0.75" stopColor="hsl(var(--brand-300))" />
                    {/* Outermost band */}
                    <stop offset="1" stopColor="hsl(var(--brand-500))" />
                  </radialGradient>
                  <radialGradient
                    id="paint2_radial_183_1690"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(814.301 944.97) rotate(141.0399) scale(142.974 294.371)"
                  >
                    {/* Outer slither ring */}
                    <stop stopColor="hsl(var(--brand-600))" />
                    <stop offset="1" stopColor="hsl(var(--brand-600))" stopOpacity="0" />
                  </radialGradient>
                  <clipPath id="clip0_183_1690">
                    <rect width="1119" height="1119" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          {/* Text container */}
          <header className="container relative mt-[8rem] gap-[8rem] sm:gap-[14rem] w-full z-10 flex flex-col text-center justify-center items-center px-4 pb-16 mx-auto">
            <h1 className="flex flex-col gap-4 items-center">
              <span className="!leading-[90%] tracking-[-0.025em] text-8xl md:text-[14vw] lg:text-[12vw] xl:text-[10vw]">
                State of
                <br /> Startups
              </span>
              <span className="text-foreground text-2xl md:text-4xl leading-[100%]">2025</span>
            </h1>

            <div className="flex flex-col gap-4 max-w-prose">
              <p className="p md:text-2xl">{pageData.heroSection.subheader}</p>

              {/* Inline version - always expanded */}
              <div className="relative flex justify-center mb-4">
                <InlineTableOfContents />
              </div>

              <p className="p md:text-2xl">{pageData.heroSection.cta}</p>
            </div>
          </header>
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
