import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import { Calendar, MapPin, Clock, Users, ChevronRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button, Badge } from 'ui'

import Layout from 'components/Layouts/Default'
import SectionContainer from 'components/Layouts/SectionContainer'
import data from 'data/aws-reinvent-2025'

const ProductHeader = dynamic(() => import('components/Sections/ProductHeader2'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))

const AWSReInvent2025: NextPage = () => {
  return (
    <>
      <NextSeo
        title={data.metadata.metaTitle}
        description={data.metadata.metaDescription}
        openGraph={{
          title: data.metadata.metaTitle,
          description: data.metadata.metaDescription,
          images: [
            {
              url: data.metadata.ogImage,
              width: 1280,
              height: 685,
              alt: 'Supabase AWS Re:Invent 2025',
            },
          ],
        }}
      />
      <Layout className="overflow-visible">
        <ProductHeader {...data.heroSection} />

        {/* Free Consultation Section */}
        <section id={data.consultationSection.id} className="relative py-16 md:py-24">
          <SectionContainer>
            <div className="max-w-4xl mx-auto">
              <div className="bg-surface-100 rounded-2xl p-8 border border-muted">
                <Badge className="mb-4">Free Consultation</Badge>
                <h2 className="text-3xl md:text-4xl font-medium mb-6">
                  {data.consultationSection.title}
                </h2>
                <p className="text-foreground-light text-lg mb-8">
                  {data.consultationSection.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {data.consultationSection.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="size-4 lg:size-5 text-brand mt-1 lg:mt-0.5 shrink-0" />
                      <span className="text-foreground-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="primary"
                  size="large"
                  iconRight={<ChevronRight className="size-3" />}
                  asChild
                >
                  <Link href={data.consultationSection.cta.href} target="_blank">
                    {data.consultationSection.cta.label}
                  </Link>
                </Button>
              </div>
            </div>
          </SectionContainer>
        </section>

        {/* Schedule Section */}
        <section id={data.scheduleSection.id} className="relative py-16 md:py-24">
          <SectionContainer className="lg:!py-0">
            <div className="lg:text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-medium mb-4">
                {data.scheduleSection.title}
              </h2>
              <p className="text-foreground-light text-lg max-w-2xl mx-auto">
                {data.scheduleSection.subtitle}
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Group events by date */}
              {['December 01', 'December 02', 'December 03', 'December 04'].map((date) => {
                const dayEvents = data.scheduleSection.schedule.filter(
                  (event) => event.date === date
                )

                return (
                  <div key={date} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-medium">{date}</h3>
                    </div>

                    <div className="space-y-4">
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className="bg-surface-100 rounded-lg p-5 border border-muted"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2 text-sm text-foreground-light">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-mono">{event.time}</span>
                                </div>
                                {event.type === 'keynote' && (
                                  <Badge variant="success">Keynote</Badge>
                                )}
                                {event.type === 'networking' && (
                                  <Badge variant="default">Networking</Badge>
                                )}
                              </div>

                              <h4 className="text-lg font-medium mb-1">{event.title}</h4>

                              {event.description && (
                                <p className="text-foreground-light mb-4">{event.description}</p>
                              )}

                              {event.location && (
                                <div className="flex items-center gap-2 text-sm text-foreground-light">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>

                            {event.cta && (
                              <Button
                                type="default"
                                size="small"
                                iconRight={<ChevronRight className="w-3 h-3" />}
                                asChild
                              >
                                <Link href={event.cta.href} target="_blank">
                                  {event.cta.label}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionContainer>
        </section>

        {/* Platform Section */}
        <PlatformSection
          id={data.platform.id}
          title={data.platform.title}
          subheading={data.platform.subheading}
          features={data.platform.features}
        />

        {/* Footer Info Section */}
        <section className="relative py-16">
          <SectionContainer>
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-4xl font-medium mb-4">
                Talk to our team and see how Supabase can help you build faster.
              </h3>

              <p className="text-foreground-light text-lg mb-8">
                Accelerate your business growth and app development using Supabase scale.
              </p>
              <Button type="default" size="large" asChild>
                <Link href={data.consultationSection.cta.href} target="_blank">
                  Book a meeting
                </Link>
              </Button>
            </div>
          </SectionContainer>
        </section>
      </Layout>
    </>
  )
}

export default AWSReInvent2025
