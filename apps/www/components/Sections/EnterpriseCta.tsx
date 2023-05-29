import Link from 'next/link'
import React from 'react'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

const EnterpriseCta = () => {
  return (
    <SectionContainer>
      <div className="flex flex-col text-center gap-4 py-8 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">
          Supabase Vector for Enterprise
        </h2>
        {/* <p className="mx-auto text-scale-900">
          Supabase products are built to work both in isolation and seamlessly together
          <br className="hidden md:block" /> to ensure the most flexible and scalable developer
          experience.
        </p> */}
        <div className="w-full mt-4 flex items-center justify-center text-center gap-4">
          <Link href="#">
            <a>
              <Button size="medium">Contact Support</Button>
            </a>
          </Link>
          <Link href="#">
            <a>
              <Button type="default" size="medium">
                Fill out Enterprise Form
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

export default EnterpriseCta
