'use client'

import { AnimatedGridBackground } from '../AnimatedGridBackground'

export function Home() {
  return (
    <>
      <section className="relative max-w-[60rem] aspect-[4/3] mx-auto border-x border-b">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={4}
          tiles={[
            { cell: 1, type: 'dots' },
            { cell: 6, type: 'dots' },
            { cell: 7, type: 'stripes' },
            { cell: 8, type: 'stripes' },
            { cell: 13, type: 'dots' },
            { cell: 18, type: 'dots' },
          ]}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h1 className="font-bold tracking-tight text-6xl md:text-7xl lg:text-[5.6rem]">
            Supabase Wrapped
          </h1>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12">
        <article className="text-2xl">
          <p>You created more Supabase databases in 2025 than in all previous years combined.</p>
        </article>
      </div>
    </>
  )
}
