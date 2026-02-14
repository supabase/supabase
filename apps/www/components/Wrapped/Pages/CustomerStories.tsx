'use client'

import Link from 'next/link'
import { cn } from 'ui'
import { AnimatedGridBackground } from '../AnimatedGridBackground'
import {
  DerivLogo,
  JuniverLogo,
  KayhanSpaceLogo,
  PhoenixEnergyLogo,
  RallyLogo,
  ResendLogo,
  SoshiLogo,
} from '../Logos'

const testimonials = [
  {
    quote:
      'We needed a system that could handle serious performance and security requirements — without slowing down our developers. Supabase has given us both.',
    author: 'Kris Woods',
    company: 'Phoenix Energy',
    url: 'https://supabase.com/customers/phoenix-energy',
    logo: <PhoenixEnergyLogo className="w-32" />,
  },
  {
    quote:
      "We could not have built this company without Supabase. If I had to go and build all these components myself, we wouldn't even have launched.",
    author: 'Thiago Peres',
    company: 'Rally',
    url: 'https://supabase.com/customers/rally',
    logo: <RallyLogo className="w-32" />,
  },
  {
    quote:
      'We used Supabase at the hackathon because it let us go from idea to MVP in under two days. Then it took only a couple of months to turn that janky MVP into a production-ready application.',
    author: 'Elijah Muraoka',
    company: 'Soshi',
    url: 'https://supabase.com/customers/soshi',
    logo: <SoshiLogo className="w-32" />,
  },
  {
    quote:
      "It's literally a night and day difference compared to Amazon RDS. With Supabase and Next.js, it's been very smooth and very fast to get new features out.",
    author: 'Hyun S',
    company: 'Kayhan Space',
    url: 'https://supabase.com/customers/kayhanspace',
    logo: <KayhanSpaceLogo className="w-24" />,
  },
  {
    quote:
      'Supabase enabled us to focus on building the best email infrastructure for developers—without worrying about backend complexity. Their authentication, database, and support have been game-changers for our rapid growth.',
    author: 'Zeno Rocha',
    company: 'Resend',
    url: 'https://supabase.com/customers/resend',
    logo: <ResendLogo className="w-32" />,
  },
  {
    quote:
      "What set Supabase apart for us was its feature set and how these features worked together cohesively to create a comprehensive environment. The platform's focus on security, performance, and developer experience aligned perfectly with our needs.",
    author: 'Raunak Kathuria',
    company: 'Deriv',
    url: 'https://supabase.com/customers/deriv',
    logo: <DerivLogo className="w-32" />,
  },
  {
    quote:
      "For me, the biggest benefit of Supabase is developer experience. My expertise doesn't lie in databases and infrastructure. It really didn't take much time at all to spin up this product with Supabase.",
    author: 'Nick Farrant',
    company: 'Juniver',
    url: 'https://supabase.com/customers/juniver',
    logo: <JuniverLogo className="w-32" />,
  },
]

export const CustomerStories = () => {
  const cols = 2

  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x border-b w-[95%] md:w-full">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={{ mobile: 2, desktop: 3 }}
          tiles={[
            { cell: 3, type: 'dots' },
            { cell: 4, type: 'dots' },
            { cell: 6, type: 'stripes' },
            { cell: 9, type: 'stripes' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] -mt-4 translate-y-2 lg:translate-y-[10px]">
            Customer Stories
          </h2>
        </div>
      </section>

      {/* NOTE (Alan): extra padding here to optically align subheading with header */}
      <div className="relative max-w-[60rem] mx-auto border-x border-b px-6 lg:px-10 py-12 w-[95%] md:w-full">
        <h3 className="text-lg">Customers count on Supabase.</h3>
      </div>

      {/* Testimonials grid */}
      <div className="relative max-w-[60rem] mx-auto border-x border-b w-[95%] md:w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {(() => {
            const remainder = testimonials.length % cols
            const emptyCells = remainder === 0 ? 0 : cols - remainder
            const totalItems = testimonials.length + emptyCells

            return (
              <>
                {testimonials.map((testimonial, index) => (
                  <Link
                    key={testimonial.company}
                    href={testimonial.url}
                    className={cn(
                      'group px-6 py-8 lg:border-r border-muted lg:[&:nth-child(2n)]:border-r-0 hover:bg-surface-75 transition-colors',
                      index < totalItems - 2 ? 'border-b' : 'lg:border-b-0',
                      index < totalItems - 1 ? 'border-b' : 'border-b-0'
                    )}
                  >
                    <div className="grid grid-rows-[44px_1fr_auto] gap-6 h-full">
                      {/* Logo placeholder */}
                      {testimonial.logo}

                      {/* Quote */}
                      <blockquote className="flex-1">
                        <p className="text-base text-foreground-light italic leading-relaxed">
                          "{testimonial.quote}"
                        </p>
                      </blockquote>

                      {/* Author */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground-lighter">
                          {testimonial.author},{' '}
                          <span className="text-foreground">{testimonial.company}</span>
                        </p>
                        <span className="text-foreground-muted group-hover:text-foreground transition-colors">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {Array.from({ length: emptyCells }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="px-6 py-8 border-r border-muted last:border-r-0"
                  />
                ))}
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}
