import { useEffect, useRef, useState } from 'react'
// Dynamically import charts to improve page load
import dynamic from 'next/dynamic'

import { animate, createSpring, createTimeline, stagger } from 'animejs'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'

import { Button, Checkbox, cn, Card, CardHeader, CardTitle, CardContent } from 'ui'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'
import ChartPieStacked from '../../design-system/registry/default/block/chart-pie-stacked'
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

  return (
    <>
      {/* <NextSeo {...pageData.seo} /> */}
      <DefaultLayout className="!bg-alternative overflow-hidden sm:!overflow-visible">
        <Hero {...pageData.heroSection} />
        <SectionContainer>
          <ol className="flex flex-col divide-y divide-dashed bg-surface-100 border border-default rounded-md px-6 py-2 mb-12">
            {pageData.pageChapters.map((chapter, chapterIndex) => (
              <li key={chapterIndex + 1}>
                <Link
                  href={`#chapter-${chapterIndex + 1}`}
                  className="py-4 text-foreground text-xl text-balance leading-relaxed text-sm flex flex-row gap-6"
                >
                  <span className="text-muted font-mono uppercase ">
                    {`${chapterIndex + 1}`} / {pageData.pageChapters.length}
                  </span>{' '}
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
  const animRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!animRef.current) return

    const strings = [
      'What’s in a modern tech stack?',
      'Where is AI delivering real product value?',
      'Which dev tools do builders swear by?',
      'How do technical founders think about growth in 2025?',
      'Where are early users really coming from?',
      'Which tools save founders the most time?',
    ]

    let currentIndex = 0

    const animateText = () => {
      const animatedText = animRef.current?.querySelector('#anim')
      if (!animatedText) return

      const currentText = strings[currentIndex]

      animatedText.textContent = currentText
      // Split by words and wrap each word, then wrap letters within each word
      animatedText.innerHTML = currentText
        .split(' ')
        .map((word) => {
          if (word.trim() === '') return ' '
          const wrappedLetters = word.replace(
            /\S/g,
            "<span class='letter' style='opacity: 0; transform: translateY(-6px); display: inline-block;'>$&</span>"
          )
          return `<span class="word" style="display: inline-block; white-space: nowrap;">${wrappedLetters}</span>`
        })
        .join(' ')

      createTimeline({
        onComplete: () => {
          currentIndex = (currentIndex + 1) % strings.length
          setTimeout(() => {
            animateOut()
          }, 100)
        },
      }).add(animatedText.querySelectorAll('.letter'), {
        opacity: [0, 1],
        translateY: [-8, 0],
        ease: createSpring({ stiffness: 150, damping: 15 }),
        duration: 500,
        delay: stagger(10),
      })
    }

    const animateOut = () => {
      const animatedText = animRef.current?.querySelector('#anim')
      if (!animatedText) return

      animate(animatedText.querySelectorAll('.letter'), {
        opacity: [1, 0],
        translateY: [0, 8],
        ease: 'inExpo',
        duration: 500,
        delay: stagger(10),
        onComplete: () => {
          setTimeout(animateText, -100)
        },
      })
    }

    animateText()

    return () => {}
  }, [])

  return (
    <>
      <div
        className={cn(
          'container relative w-full mx-auto px-6 py-8 md:py-16 sm:px-16 xl:px-20',
          props.className
        )}
      >
        <div
          ref={animRef}
          className="flex flex-col text-center items-center justify-center min-h-[600px] lg:min-h-[70vh]"
        >
          <div className="absolute overflow-hidden -mx-[15vw] sm:mx-0 inset-0 w-[calc(100%+30vw)] sm:w-full h-full col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7 flex justify-center">
            <svg
              width="558"
              height="392"
              viewBox="0 0 558 392"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute w-full h-full inset-0 -top-40 lg:top-0 xl:-left-40 animate-pulse"
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
                  <stop stopColor="hsl(var(--foreground-default))" />
                  <stop offset="1" stopColor="hsl(var(--foreground-default))" stopOpacity="0" />
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
                    <stop stopColor="hsl(var(--border-muted))" />
                    <stop
                      offset="0.716346"
                      stopColor="hsl(var(--background-alternative-default))"
                    />
                    <stop
                      offset="0.754808"
                      stopColor="hsl(var(--background-alternative-default))"
                    />
                    <stop offset="1" stopColor="hsl(var(--border-strong))" />
                  </radialGradient>
                  <radialGradient
                    id="paint2_radial_183_1690"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(814.301 175.03) rotate(-38.9601) scale(142.974 294.371)"
                  >
                    <stop stopColor="hsl(var(--foreground-default))" />
                    <stop offset="1" stopColor="hsl(var(--foreground-default))" stopOpacity="0" />
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
                  <stop stopColor="hsl(var(--background-alternative-default))" stopOpacity="0" />
                  <stop offset="1" stopColor="hsl(var(--background-alternative-default))" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="relative w-full z-10 flex flex-col items-center mx-auto">
            <div className="flex gap-2 mb-4 md:mb-8">
              <div className="w-11 h-11 relative flex items-center justify-center bg-default border rounded-lg">
                <Image
                  src="/images/supabase-logo-icon.svg"
                  alt="Supabase icon"
                  width={60}
                  height={60}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <div>
              {props.icon || props.title ? (
                <div className="mb-2 flex justify-center items-center gap-3">
                  {props.title && (
                    <h1
                      className="text-brand font-mono uppercase tracking-widest text-sm"
                      key={`product-name-${props.title}`}
                    >
                      {props.title}
                    </h1>
                  )}
                </div>
              ) : null}
            </div>
            <div className={cn('flex flex-col gap-4 items-center')}>
              <div className="flex h-[150px] items-center">
                <div
                  id="anim"
                  className="will-change-transform leading-[120%] text-4xl sm:text-5xl md:text-6xl min-h-[4rem] max-w-2xl [&_.letter]:transform"
                >
                  State of Startups
                </div>
              </div>
              <p className="p !text-foreground-light max-w-lg">{props.subheader}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StateOfStartupsPage
