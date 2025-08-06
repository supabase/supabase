import { useEffect, useRef, useState } from 'react'

import { animate, createSpring, createTimeline, stagger } from 'animejs'
import Link from 'next/link'
import Image from 'next/image'
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

interface FormData {
  email: string
  terms: boolean
}

interface FormItem {
  type: 'email' | 'checkbox'
  label: string
  placeholder: string
  required: boolean
  className?: string
  component: typeof Input | typeof Checkbox
}

type FormConfig = {
  [K in keyof FormData]: FormItem
}

const formConfig: FormConfig = {
  email: {
    type: 'email',
    label: 'Email',
    placeholder: 'Email',
    required: true,
    className: '',
    component: Input,
  },
  terms: {
    type: 'checkbox',
    label: '',
    placeholder: '',
    required: true,
    className: '',
    component: Checkbox,
  },
}

const defaultFormValue: FormData = {
  email: '',
  terms: false,
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

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
        const heroHeight = heroElement.offsetHeight
        const heroTop = heroElement.offsetTop

        if (scrollY > heroTop + heroHeight) {
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
      if (tocRef.current && !tocRef.current.contains(event.target as Node)) {
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

  const FloatingTableOfContents = () => {
    if (!showFloatingToc) return null

    const currentChapter = pageData.pageChapters[activeChapter - 1]

    return (
      <div
        ref={tocRef}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
      >
        <div className="relative">
          {/* Closed state - shows current chapter */}
          {!isTocOpen && (
            <Button
              type="default"
              size="small"
              iconRight={<Maximize2 size={14} />}
              onClick={() => setIsTocOpen(true)}
              className="flex flex-row gap-2 shadow-xl rounded-2xl px-3"
            >
              <div className="flex items-center gap-2">
                <span className="bg-surface-100 border border-surface-200 rounded-xl w-5 h-5 flex items-center justify-center text-foreground-light font-mono uppercase text-xs">
                  {activeChapter}
                </span>
                {currentChapter?.title}
              </div>
            </Button>
          )}

          {/* Open state - shows full table of contents */}
          {isTocOpen && (
            <div className="bg-surface-100 border border-default rounded-md shadow-lg min-w-[300px] max-w-[400px]">
              <div className="flex items-center justify-between p-4 border-b border-default">
                <button
                  onClick={() => setIsTocOpen(false)}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="max-h-[60vh] overflow-y-auto">
                {pageData.pageChapters.map((chapter, chapterIndex) => (
                  <li key={chapterIndex + 1}>
                    <Link
                      href={`#chapter-${chapterIndex + 1}`}
                      onClick={() => setIsTocOpen(false)}
                      className={cn(
                        'block py-3 px-4 text-sm transition-colors',
                        chapterIndex + 1 === activeChapter
                          ? 'bg-brand/10 text-brand border-r-2 border-brand'
                          : 'text-foreground hover:bg-surface-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted font-mono uppercase text-xs min-w-[2rem]">
                          {chapterIndex + 1} / {pageData.pageChapters.length}
                        </span>
                        <span className="text-balance leading-relaxed">{chapter.title}</span>
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
      <DefaultLayout className="!bg-alternative overflow-hidden sm:!overflow-visible">
        <FloatingTableOfContents />
        <div ref={heroRef}>
          <Hero {...pageData.heroSection} />
        </div>
        <SectionContainer>
          {/* table of contents */}
          <ol className="flex flex-col divide-y divide-dashed bg-surface-100 border border-default rounded-md px-6 py-2 mb-12 max-w-md mx-auto">
            {pageData.pageChapters.map((chapter, chapterIndex) => (
              <li key={chapterIndex + 1}>
                <Link
                  href={`#chapter-${chapterIndex + 1}`}
                  className="block flex-1 py-4 text-foreground-light font-mono uppercase text-center flex flex-row gap-6"
                >
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ol>
        </SectionContainer>

        {pageData.pageChapters.map((chapter, chapterIndex) => (
          <SurveyChapter
            key={chapterIndex + 1}
            number={chapterIndex + 1}
            totalChapters={pageData.pageChapters.length}
            title={chapter.title}
            description={chapter.description}
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
                pullQuote={section.pullQuote}
              />
            ))}
          </SurveyChapter>
        ))}
      </DefaultLayout>
    </>
  )
}

const Hero = (props: any) => {
  return (
    <>
      <div
        className={cn(
          'container relative w-full mx-auto px-6 py-8 md:py-16 sm:px-16 xl:px-20',
          props.className
        )}
      >
        <div className="flex flex-col text-center items-center justify-center min-h-[600px] lg:min-h-[70vh]">
          <div className="absolute overflow-hidden -mx-[15vw] sm:mx-0 inset-0 w-[calc(100%+30vw)] sm:w-full h-full col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7 flex justify-center">
            <svg
              width="558"
              height="392"
              viewBox="0 0 558 392"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute w-full h-full inset-0 -top-40 lg:-top-20 xl:-left-40 animate-pulse"
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
                  gradientTransform="translate(349.764 144.755) rotate(-132.179) scale(202.74 202.839)"
                >
                  <stop stopColor="hsl(var(--brand-200))" />
                  <stop offset="1" stopColor="hsl(var(--brand-200))" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
            <div className="sm:w-full sm_h-full sm:flex sm:justify-center">
              <svg
                width="1119"
                height="1119"
                viewBox="0 0 1119 1119"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-auto -mb-72 sm:-mt-60 md:-mt-40 lg:-mt-12 xl:mt-0 animate-spinner !ease-linear transform"
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
                    gradientTransform="translate(571.212 579.87) rotate(122.182) scale(542.117 690.275)"
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
                    gradientTransform="translate(814.301 175.03) rotate(-38.9601) scale(142.974 294.371)"
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
            <svg
              width="1096"
              height="482"
              viewBox="0 0 1096 482"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute min-w-full inset-0 top-auto z-10"
            >
              <rect x="0.500488" width="1095" height="482" fill="url(#paint0_linear_183_1694)" />
              <defs>
                <linearGradient
                  id="paint0_linear_183_1694"
                  x1="922.165"
                  y1="63.3564"
                  x2="922.165"
                  y2="419.772"
                  gradientUnits="userSpaceOnUse"
                >
                  {/* Bottom shadow */}
                  <stop stopColor="hsl(var(--background-alternative-default))" stopOpacity="0" />
                  <stop offset="1" stopColor="hsl(var(--background-alternative-default))" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative w-full z-10 flex flex-col gap-10 items-center mx-auto">
            {/* <div className={cn('flex flex-col gap-4 items-center')}> */}
            <h1 className="flex flex-col gap-4 items-center">
              <span className="!leading-[90%] tracking-[-0.025em] text-7xl md:text-[8rem] lg:text-[11.25rem] ">
                State of
                <br /> Startups
              </span>
              <span className="text-foreground text-2xl md:text-4xl leading-[100%]">2025</span>
            </h1>
            <p className="p md:text-2xl max-w-lg">{props.subheader}</p>
            {/* </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

export default StateOfStartupsPage
