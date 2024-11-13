import { EmptyStatePanel } from 'components/layouts/explorer/empty-state-panel'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Sparkles } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import { Separator } from 'ui'
import { motion, Variants } from 'framer-motion'

const ExplorerPage: NextPageWithLayout = () => {
  const EXPLORER_PANELS = [
    {
      title: `Create a table`,
      description: `Write and execute SQL queries in an interactive editor with syntax highlighting and autocompletion.`,
      buttonText: 'Open SQL Editor',
      aiButtonText: 'Generate SQL',
    },
    {
      title: `Write SQL`,
      description: `Browse and manage your database with an intuitive interface. Create and modify tables, manage relationships, and edit data directly.`,
      buttonText: 'Open Table Editor',
      aiButtonText: 'Generate Schema',
    },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 50,
        staggerChildren: 0.08,
        delayChildren: 0.03,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 50,
        staggerChildren: 0.08,
        delayChildren: 0.03,
      },
    },
  }

  return (
    <>
      <motion.div
        className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-5 gap-12"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.div
          className="w-full bg-surface-200 dark:bg-surface-100 rounded-lg overflow-hidden relative border border-muted"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background-surface-200 via-background-surface-200 to-transparent"></div>
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="absolute inset-y-0 right-0 max-h-[300px]"
              style={{
                width: '70%',
                background: `linear-gradient(135deg, 
                rgba(229, 231, 235, ${0.3 - index * 0.05}) 0%, 
                rgba(209, 213, 219, ${0.3 - index * 0.05}) 50%, 
                transparent 100%)`,
                transform: `skew(-12deg) translateX(${index * 15}%)`,
                maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 85%)',
                boxShadow: `-1px 0 2px rgba(0, 0, 0, 0.03)`,
              }}
            ></div>
          ))}
          <div className="relative z-10 p-8 text-gray-700 h-full flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366f1]/10">
                  <Sparkles size={14} className="text-[#6366f1]" />
                </div>
                <h2 className="text-base text-foreground">AI Assistant</h2>
              </div>
              <p className="text-sm text-foreground-light max-w-md">
                This panel features geometric shapes on the right side, each with a distinct shade
                and reduced opacity, creating a subtle fade-out effect.
              </p>
            </div>
            <p className="text-xs text-foreground-lighter max-w-md">
              The shapes now have a more delicate gradation, transitioning smoothly from slightly
              darker to lighter and more transparent.
            </p>
          </div>
        </motion.div>
        <Separator />

        <motion.div className="flex gap-16" variants={itemVariants}>
          {EXPLORER_PANELS.map((data, index) => (
            <motion.div
              key={data.title}
              variants={itemVariants}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <EmptyStatePanel {...data} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="w-full rounded-lg overflow-hidden relative border border-muted"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background-surface-200 via-background-surface-200 to-transparent"></div>
          <div className="relative z-10 p-8 text-gray-700 h-full flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366f1]/10">
                  <Sparkles size={14} className="text-[#6366f1]" />
                </div>
                <h2 className="text-base text-foreground">Migrate to Supabase</h2>
              </div>
              <p className="text-sm text-foreground-light max-w-md">
                This panel features geometric shapes on the right side, each with a distinct shade
                and reduced opacity, creating a subtle fade-out effect.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

ExplorerPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout hideTabs>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerPage
