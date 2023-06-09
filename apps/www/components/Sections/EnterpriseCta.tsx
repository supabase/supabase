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
        <p className="mx-auto text-scale-900 w-full">
          Talk to one of our experts about scaling Supabase Vector{' '}
          <br className="hidden md:block" />
          and managing embeddings at scale.
        </p>
        <div className="w-full mt-4 flex items-center justify-center text-center gap-4">
          <Link href="https://forms.supabase.com/enterprise">
            <a>
              <Button size="medium">Fill out Enterprise Form</Button>
            </a>
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

export default EnterpriseCta
