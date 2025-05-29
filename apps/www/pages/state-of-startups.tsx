import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import DefaultLayout from '~/components/Layouts/Default'

import { useBreakpoint } from 'common'
import data from '~/data/surveys/state-of-startups-2025'
import { Button, Checkbox, cn } from 'ui'
import Link from 'next/link'
import SectionContainer from '../components/Layouts/SectionContainer'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'
import { useEffect, useRef } from 'react'
import { animate, createAnimatable, createSpring, createTimeline, stagger } from 'animejs'
import Image from 'next/image'

function VectorPage() {
  // base path for images
  const isXs = useBreakpoint(640)
  const pageData = data(isXs)
  const meta_title = pageData.metaTitle
  const meta_description = pageData.metaDescription
  const meta_image = pageData.metaImage

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/modules/vector`,
          images: [
            {
              url: meta_image,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative">
        <Hero {...pageData.heroSection} />
        <SectionContainer>
          <div className="flex flex-col text-center gap-4 py-8 items-center justify-center">
            <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">Stay in touch</h2>
            <p className="mx-auto text-foreground-lighter w-full">
              Sign up for our newsletter to be notified when the survey results are available.
            </p>
            <div className="w-full mt-4 flex items-center justify-center text-center gap-4">
              <form action="" className="w-full max-w-md flex flex-col gap-4 items-center">
                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input type="email" placeholder="Email" />
                  <Button size="small" onClick={() => null}>
                    Register
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="terms" className="[&>input]:m-0" />
                  <Label htmlFor="terms" className="text-foreground-lighter">
                    We process your information in accordance with our{' '}
                    <Link href="/privacy" className="text-foreground-light hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
              </form>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

const Hero = (props: any) => {
  const animRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!animRef.current) return

    // Array of strings to cycle through
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
        translateY: [-6, 0],
        ease: createSpring({ stiffness: 150, damping: 10 }),
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
          // Start the next string animation
          setTimeout(animateText, -100)
        },
      })
    }

    // Start the animation loop
    animateText()

    // Cleanup function - anime.js v4 handles cleanup automatically
    return () => {}
  }, [])

  // SVG rotation effect
  useEffect(() => {
    if (!svgRef.current || !animRef.current) return

    const svg = svgRef.current
    const container = animRef.current

    const { PI } = Math

    // Create animatable for SVG rotation
    const svgAnimatable = createAnimatable(svg, {
      rotate: { unit: 'rad' },
      duration: 0,
    })

    let bounds = container.getBoundingClientRect()
    const refreshBounds = () => (bounds = container.getBoundingClientRect())

    let lastAngle = 0
    let angle = 0

    const onMouseMove = (e: MouseEvent) => {
      const { width, height, left, top } = bounds
      const x = e.clientX - left - width / 2
      const y = e.clientY - top - height / 2
      const currentAngle = Math.atan2(y, x)
      const diff = currentAngle - lastAngle
      angle += diff > PI ? diff - 2 * PI : diff < -PI ? diff + 2 * PI : diff
      lastAngle = currentAngle
      svgAnimatable.rotate(angle * 0.1) // Slow down rotation with 0.1 multiplier
    }

    // Add event listeners
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', refreshBounds)
    window.addEventListener('resize', refreshBounds)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', refreshBounds)
      window.removeEventListener('resize', refreshBounds)
    }
  }, [])

  return (
    <div
      className={cn(
        'container relative w-full mx-auto px-6 py-8 md:py-16 sm:px-16 xl:px-20',
        props.className
      )}
    >
      <div
        ref={animRef}
        className="flex flex-col text-center items-center justify-center min-h-[70vh]"
      >
        <div className="absolute overflow-hidden inset-0 w-full h-full col-span-12 lg:col-span-7 xl:col-span-6 xl:col-start-7 flex justify-center">
          <svg
            width="558"
            height="392"
            viewBox="0 0 558 392"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute w-full h-full inset-0 xl:-left-40"
          >
            <circle
              cx="278.831"
              cy="112.952"
              r="278.5"
              transform="rotate(75 278.831 112.952)"
              fill="url(#paint0_radial_183_1691)"
              fillOpacity="0.08"
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
                <stop stopColor="white" />
                <stop offset="1" stopColor="#D9D9D9" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          <svg
            ref={svgRef}
            width="1119"
            height="1119"
            viewBox="0 0 1119 1119"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-mt-96 md:-mt-32 lg:-mt-12 xl:mt-0"
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
                <stop stopColor="#1B1B1B" />
                <stop offset="0.716346" stopColor="#0D0D0D" />
                <stop offset="0.754808" stopColor="#0A0A0A" />
                <stop offset="1" stopColor="#383838" />
              </radialGradient>
              <radialGradient
                id="paint2_radial_183_1690"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(814.301 175.03) rotate(-38.9601) scale(142.974 294.371)"
              >
                <stop stopColor="#D9D9D9" />
                <stop offset="1" stopColor="#D9D9D9" stopOpacity="0" />
              </radialGradient>
              <clipPath id="clip0_183_1690">
                <rect width="1119" height="1119" fill="white" />
              </clipPath>
            </defs>
          </svg>
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
            <div className="w-11 h-11 relative flex items-center justify-center border rounded-lg">
              <Image
                src="/images/supabase-logo-icon.svg"
                alt="Supabase icon"
                width={60}
                height={60}
                className="w-6 h-6"
              />
            </div>
            <div className="w-11 h-11 relative flex items-center justify-center border rounded-lg bg-[#FB651E]">
              <svg
                width="20"
                height="25"
                viewBox="0 0 20 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.59714 15.4749L0.863647 0.987762H4.39796L8.94708 10.156C9.01706 10.3193 9.09871 10.4884 9.19203 10.6634C9.28534 10.8383 9.36699 11.0191 9.43698 11.2058C9.48364 11.2758 9.51863 11.3399 9.54196 11.3982C9.56529 11.4566 9.58862 11.509 9.61195 11.5557C9.72859 11.789 9.83357 12.0164 9.92689 12.2381C10.0202 12.4597 10.1018 12.6638 10.1718 12.8505C10.3585 12.4539 10.5626 12.0281 10.7842 11.5732C11.0058 11.1183 11.2333 10.6459 11.4666 10.156L16.0857 0.987762H19.375L11.5716 15.6499V24.9931H8.59714V15.4749Z"
                  fill="white"
                />
              </svg>
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
                className="will-change-transform text-5xl md:text-6xl min-h-[4rem] max-w-2xl [&_.letter]:transform"
              >
                State of Startups
              </div>
            </div>
            <p className="p !text-foreground-light max-w-xl">{props.subheader}</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col items-stretch sm:flex-row pt-2 sm:items-center gap-2">
            {props.cta && (
              <Button size="small" className="text-white" asChild>
                <Link href={props.cta.link} as={props.cta.link}>
                  {props.cta.label ?? 'Start for free'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VectorPage
