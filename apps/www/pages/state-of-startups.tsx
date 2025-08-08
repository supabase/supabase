import { useEffect, useRef, useState } from 'react'

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
  const [inlineRotatingChapter, setInlineRotatingChapter] = useState(1)
  const tocRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const inlineTocRef = useRef<HTMLDivElement>(null)

  // Auto-rotate chapters for inline ToC
  useEffect(() => {
    // Don't rotate if the ToC is open
    if (isTocOpen) return

    const interval = setInterval(() => {
      setInlineRotatingChapter((prev) => {
        const next = prev + 1
        return next > pageData.pageChapters.length ? 1 : next
      })
    }, 1200)

    return () => clearInterval(interval)
  }, [pageData.pageChapters.length, isTocOpen])

  // Scroll detection to show floating ToC
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroElement = heroRef.current
      const inlineTocElement = inlineTocRef.current

      if (heroElement && inlineTocElement) {
        const inlineTocRect = inlineTocElement.getBoundingClientRect()

        // Show floating ToC when the inline ToC is completely out of view (scrolled past)
        if (inlineTocRect.bottom < 0) {
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
      // Check both floating and inline refs
      const isOutsideFloating = tocRef.current && !tocRef.current.contains(event.target as Node)
      const isOutsideInline =
        inlineTocRef.current && !inlineTocRef.current.contains(event.target as Node)

      // Close if clicking outside the currently relevant ToC
      if (showFloatingToc ? isOutsideFloating : isOutsideInline) {
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

  // Shared Table of Contents component
  const TableOfContents = ({
    variant = 'floating',
    className = '',
    showRotating = false,
  }: {
    variant?: 'floating' | 'inline'
    className?: string
    showRotating?: boolean
  }) => {
    const currentChapter = pageData.pageChapters[activeChapter - 1]
    const rotatingChapter = pageData.pageChapters[inlineRotatingChapter - 1]
    const displayChapter = showRotating ? rotatingChapter : currentChapter
    const displayChapterNumber = showRotating ? inlineRotatingChapter : activeChapter

    const isFloating = variant === 'floating'
    const shouldShow = isFloating ? showFloatingToc : true

    if (!shouldShow) return null

    return (
      <div
        ref={isFloating ? tocRef : inlineTocRef}
        className={cn(
          isFloating
            ? 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300'
            : 'relative transition-opacity duration-300',
          showFloatingToc && !isFloating ? 'opacity-50' : 'opacity-100'
        )}
      >
        <div className={cn('relative', className)}>
          {/* Closed state - shows current chapter */}
          <Button
            type="default"
            size="small"
            iconRight={<Maximize2 size={14} />}
            onClick={() => setIsTocOpen(true)}
            className={cn(
              'flex flex-row gap-2 shadow-xl rounded-full px-3',
              isTocOpen && (isFloating ? 'hidden' : 'invisible')
            )}
          >
            <div className={cn('flex items-center gap-2')}>
              <span className="bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light font-mono uppercase text-xs">
                {displayChapterNumber}
              </span>
              {displayChapter?.title}
            </div>
          </Button>

          {/* Open state - shows full table of contents */}
          {isTocOpen && (
            <div
              className={cn(
                'bg-surface-100 border border-default rounded-lg shadow-xl overflow-hidden min-w-[300px]',
                // For inline variant, position absolutely to avoid layout shift
                !isFloating &&
                  'absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
              )}
            >
              <ol className="max-h-[60vh] overflow-y-auto">
                {pageData.pageChapters.map((chapter, chapterIndex) => (
                  <li key={chapterIndex + 1}>
                    <Link
                      href={`#chapter-${chapterIndex + 1}`}
                      onClick={() => setIsTocOpen(false)}
                      className={cn(
                        'block py-3 px-4 text-sm transition-colors',
                        chapterIndex + 1 === activeChapter
                          ? 'bg-brand/10 text-brand'
                          : 'text-foreground hover:bg-surface-300'
                      )}
                    >
                      <div className="flex justify-between gap-6">
                        <span className="hidden bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light font-mono uppercase text-xs">
                          {chapterIndex + 1}
                        </span>
                        <span className="text-balance text-center flex-1">{chapter.title}</span>
                        <span className="hidden opacity-0 bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light font-mono uppercase text-xs">
                          {chapterIndex + 1}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* <NextSeo {...pageData.seo} /> */}
      <DefaultLayout className="!bg-alternative overflow-hidden">
        {/* Floating version */}
        <TableOfContents variant="floating" />

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

              {/* Inline version with rotating chapters */}
              <div className="relative flex justify-center mb-4">
                <TableOfContents variant="inline" showRotating={true} />
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
