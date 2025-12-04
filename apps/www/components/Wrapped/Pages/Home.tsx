'use client'

import { Button } from 'ui'
import { motion } from 'framer-motion'
import { useWrapped } from '../WrappedContext'
import { Dots, Stripes } from '../Visuals'

const GRID_COLS = 5
const STAGGER_DELAY = 0.05

export function Home() {
  const { setCurrentPage } = useWrapped()

  return (
    <>
      <section className="relative max-w-[60rem] aspect-[4/3] mx-auto border-x border-b">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 h-full [&>*]:border-muted [&>*]:border-r [&>*]:border-b [&>*:nth-child(5n)]:border-r-0 [&>*:nth-child(n+16)]:border-b-0">
          {Array.from({ length: 20 }).map((_, i) => {
            const row = Math.floor(i / GRID_COLS)
            const col = i % GRID_COLS
            const diagonalIndex = row + col
            const hasContent = [1, 6, 7, 8, 13, 18].includes(i)

            return (
              <div key={i} className="relative">
                {hasContent && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: diagonalIndex * STAGGER_DELAY,
                      duration: 0.3,
                      ease: 'easeOut',
                    }}
                  >
                    {i === 1 && <Dots />}
                    {i === 6 && <Dots />}
                    {i === 7 && <Stripes />}
                    {i === 8 && <Stripes />}
                    {i === 13 && <Dots />}
                    {i === 18 && <Dots />}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-8 py-0 relative">
          <h1 className="font-bold tracking-tight text-[5.6rem]">Supabase Wrapped</h1>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-8 py-12 grid grid-cols-[60%,1fr]">
        <article className="text-2xl">
          <p>You created more Supabase databases in 2025 than in all previous years combined.</p>
        </article>

        <div className="grid items-center justify-end">
          <Button size="large" onClick={() => setCurrentPage('intro')}>
            See our journey
          </Button>
        </div>
      </div>
    </>
  )
}
