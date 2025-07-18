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

import { TeamCountChart } from '~/components/SurveyResults/TeamCountChart'
import { TechnicalFoundersChart } from '~/components/SurveyResults/TechnicalFoundersChart'
import { PreviousCompanyChart } from '~/components/SurveyResults/PreviousCompanyChart'
import { FundingStageChart } from '~/components/SurveyResults/FundingStageChart'
import { HeadquartersChart } from '~/components/SurveyResults/HeadquartersChart'
import { SectionIntro } from '~/components/SurveyResults/SectionIntro'
import { RoleChart } from '~/components/SurveyResults/RoleChart'
import { PersonAgeChart } from '~/components/SurveyResults/AgeChart'
import { MonetizationChart } from '~/components/SurveyResults/MonetizationChart'
import { AcceleratorParticipationChart } from '~/components/SurveyResults/AcceleratorParticipationChart'
import { PivotFreqChart } from '~/components/SurveyResults/PivotFreqChart'
import { FrontendStackChart } from '~/components/SurveyResults/FrontendStackChart'
import { BackendStackChart } from '~/components/SurveyResults/BackendStackChart'
import { CloudProviderChart } from '~/components/SurveyResults/CloudProviderChart'
import { SalesToolsChart } from '~/components/SurveyResults/SalesToolsChart'
import { PricingChart } from '~/components/SurveyResults/PricingChart'

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
  const meta_title = pageData.metaTitle
  const meta_description = pageData.metaDescription
  const meta_image = pageData.metaImage

  const [formData, setFormData] = useState<FormData>(defaultFormValue)
  const [honeypot, setHoneypot] = useState<string>('') // field to prevent spam
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  const sendTelemetryEvent = useSendTelemetryEvent()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setErrors({})
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault()
    setFormData(defaultFormValue)
    setSuccess(null)
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: { [key in keyof FormData]?: string } = {}

    // Check required fields
    for (const key in formConfig) {
      if (formConfig[key as keyof FormData].required && !formData[key as keyof FormData]) {
        if (key === 'email') {
          newErrors[key as keyof FormData] = `Email is required`
        } else if (key === 'terms') {
          newErrors[key as keyof FormData] = `You must agree to the terms`
        }
      }
    }

    // Validate email
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    setErrors(newErrors)

    // Return validation status, also check if honeypot is filled (indicating a bot)
    return Object.keys(newErrors).length === 0 && honeypot === ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000

    // Spam prevention: Reject form if submitted too quickly (less than 3 seconds)
    if (timeElapsed < 3) {
      setErrors({ general: 'Submission too fast. Please fill the form correctly.' })
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setSuccess(null)

    try {
      const response = await fetch('/api-v2/submit-form-sos2025-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Thank you for your submission!')
        setFormData({ email: '', terms: false })
      } else {
        const errorData = await response.json()
        setErrors({ general: `Submission failed: ${errorData.message}` })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

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
              url: meta_image,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative overflow-hidden sm:!overflow-visible">
        <Hero {...pageData.heroSection} />
        <SectionContainer>
          <div className="flex flex-col gap-4 py-8 items-center justify-center">
            <SectionIntro
              title="Founder and Company Basics"
              description="Today’s startup ecosystem is dominated by young, technical builders shipping fast with lean teams."
              text="Most survey respondents identified as founders (76%), with engineers as the next-largest group (18%). Age-wise, 82% of participants are under 40, with the largest cohort in the 22–29 age range (36.4%). These are early-career founders starting small: 91% of companies have 10 or fewer employees, and 66% were founded within the last year. Two-thirds are bootstrapped, with fewer than 6% reaching Series A or beyond."
            />

            <RoleChart />
            <PersonAgeChart />
            <TechnicalFoundersChart />
            <PreviousCompanyChart />
            <TeamCountChart />
            <FundingStageChart />
            <HeadquartersChart />
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="flex flex-col gap-4 py-8 items-center justify-center">
            <SectionIntro
              title="Product and Market"
              description="Startups are building a diverse mix of software products, iterating quickly, and pursuing monetization selectively."
              text="TBA"
            />

            <MonetizationChart />
            <AcceleratorParticipationChart />
            <PivotFreqChart />
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="flex flex-col gap-4 py-8 items-center justify-center">
            <SectionIntro
              title="Tech Stack"
              description="The modern stack centers around open tools, modular infrastructure, and cautious spending."
              text="Postgres is the default database. Supabase is the most widely used hosted option (62.1%), often paired with pgvector for AI workloads. React remains the dominant frontend, while Node.js and Python top the backend. Developer tools like GitHub, Stripe, and Postman round out the stack. Cloud usage reveals a clear split: Supabase leads for managed backends (62%), followed by Vercel (37%) and AWS (27%). Cloudflare (21%) and GCP (13%) are used tactically."
            />

            <FrontendStackChart />
            <BackendStackChart />
            <CloudProviderChart />
          </div>
        </SectionContainer>

        <SectionContainer>
          <div className="flex flex-col gap-4 py-8 items-center justify-center">
            <SectionIntro
              title="Go-To-Market"
              description="Startups start selling through networks and dev communities, then layer in more structured growth."
              text="The first users come from dev communities, Product Hunt, Hacker News, and personal networks. Most teams use product-led growth and only layer in sales after demand picks up. CRM use is lightweight—Google Sheets and Notion still dominate."
            />

            <SalesToolsChart />
            <PricingChart />
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

const Hero = (props: any) => {
  const animRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!animRef.current) return

    const strings = [
      "What's your tech stack?",
      "What's your favorite AI developer tool?",
      'Which vector database are you using?',
      'Are you building AI Agents?',
      'Do you use OpenTelemetry?',
      'Where do you go to learn?',
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
