'use client'

import { motion, AnimatePresence } from 'framer-motion'
import DefaultLayout from '~/components/Layouts/Default'
import { WrappedProvider, useWrapped } from '~/components/Wrapped/WrappedContext'
import { Home } from '~/components/Wrapped/Pages/Home'
import { Intro } from '~/components/Wrapped/Pages/Intro'
import { YearOfAI } from '~/components/Wrapped/Pages/YearOfAI'
import { Devs } from '~/components/Wrapped/Pages/Devs'
import { TableOfContents } from '~/components/Wrapped/TableOfContents'

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { type: 'spring', duration: 0.4, bounce: 0 },
}

function WrappedContent() {
  const { currentPage } = useWrapped()

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'home' && (
        <motion.div key="home" {...pageTransition} initial={false}>
          <Home />
        </motion.div>
      )}
      {currentPage === 'intro' && (
        <motion.div key="intro" {...pageTransition}>
          <Intro />
        </motion.div>
      )}
      {currentPage === 'year-of-ai' && (
        <motion.div key="year-of-ai" {...pageTransition}>
          <YearOfAI />
        </motion.div>
      )}
      {currentPage === 'devs' && (
        <motion.div key="devs" {...pageTransition}>
          <Devs />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SupabaseWrappedPage() {
  return (
    <WrappedProvider>
      <DefaultLayout className="bg-alternative relative">
        {/*<TableOfContents />*/}
        <WrappedContent />
      </DefaultLayout>
    </WrappedProvider>
  )
}
