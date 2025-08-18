'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import DefaultLayout from '~/components/Layouts/Default'
import CustomersFilters from '~/components/CustomerStories/CustomersFilters'
import { cn } from 'ui'
import styles from '~/styles/customers.module.css'
import { motion } from 'framer-motion'
import { GlassPanel } from 'ui-patterns/GlassPanel'

const MotionLink = motion(Link)

export default function CustomersClient(props: any) {
  const _allCustomers = useMemo(
    () =>
      props.blogs?.map((blog: any) => ({
        logo: blog.logo,
        logoInverse: blog.logo_inverse,
        name: blog.name,
        title: blog.title,
        link: blog.url,
        industry: blog.industry,
        products: blog.supabase_products,
        description: blog.description,
      })),
    [props.blogs]
  )

  const [customers, setCustomers] = useState(_allCustomers)

  return (
    <DefaultLayout>
      <div className="relative z-0 bg-background overflow-hidden">
        <div className="container mx-auto mt-28 sm:mt-44 px-4 xl:px-20">
          <div className="mx-auto relative z-10">
            <motion.div
              className="mx-auto sm:max-w-2xl text-center flex flex-col items-center mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
            >
              <h1 className="text-foreground mb-3 text-3xl">Customer stories</h1>
              <h2 className="text-foreground-light text-base sm:text-xl">
                Discover case studies on how Supabase is being used around the world to quickly
                create outstanding products and set new industry standards.
              </h2>
            </motion.div>
            <CustomersFilters
              allCustomers={_allCustomers}
              setCustomers={setCustomers}
              industries={props.industries}
              products={props.products}
            />
            <div className="mx-auto mt-4 sm:mt-6 mb-12 md:mb-20 grid grid-cols-12 gap-6 not-prose">
              {customers?.length ? (
                customers?.map((caseStudy: any, i: number) => (
                  <MotionLink
                    href={`${caseStudy.link}`}
                    key={caseStudy.title}
                    className="col-span-12 md:col-span-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.4,
                        ease: [0.24, 0.25, 0.05, 1],
                        delay: 0.2 + i / 15,
                      },
                    }}
                  >
                    <GlassPanel
                      {...caseStudy}
                      background={true}
                      showIconBg={true}
                      showLink={true}
                      hasLightIcon
                    >
                      {caseStudy.description}
                    </GlassPanel>
                  </MotionLink>
                ))
              ) : (
                <div className="col-span-12 flex flex-col gap-2 py-4 text-sm text-muted">
                  <p>No customers found</p>
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              'absolute inset-0 h-[150px] sm:h-[300px] bg-background z-0 after:!bg-background',
              styles['bg-visual']
            )}
          />
        </div>
      </div>
    </DefaultLayout>
  )
}
