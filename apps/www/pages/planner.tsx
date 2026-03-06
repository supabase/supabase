/**
 * Database Planner Page
 *
 * An interactive wizard that helps users diagnose database issues
 * and recommends appropriate Supabase solutions.
 *
 * The flow is powered by a Mermaid diagram - edit the diagram in
 * /data/planner-flow.ts to modify the decision tree.
 */

import { useMemo, useState } from 'react'
import { NextSeo } from 'next-seo'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Database, RefreshCw, Search } from 'lucide-react'
import { Button, cn, Input } from 'ui'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import {
  SymptomCard,
  DiagnosticCard,
  SolutionCard,
  ProgressBar,
  PathBreadcrumbs,
} from '~/components/Planner'
import { usePlannerFlow } from '~/lib/planner/use-planner-flow'

function PlannerPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const {
    state,
    currentNode,
    symptoms,
    options,
    isSolution,
    solutionDetails,
    diagnosticDetails,
    pathHistory,
    progress,
    selectSymptom,
    selectOption,
    goBack,
    reset,
    relatedSolutions,
  } = usePlannerFlow()

  const isStart = state.path.length === 0

  // Determine current view
  const currentView = useMemo(() => {
    if (isStart) return 'symptoms'
    if (isSolution && solutionDetails) return 'solution'
    if (currentNode?.type === 'diagnostic') return 'diagnostic'
    // If at a symptom with outgoing edges, show options
    if (currentNode?.type === 'symptom' && options.length > 0) return 'diagnostic'
    return 'symptoms'
  }, [isStart, isSolution, solutionDetails, currentNode, options])

  const meta = {
    title: 'Database Planner | Supabase',
    description:
      'Diagnose your database issues and find the right Supabase solution. An interactive guide to help you scale your Postgres database.',
  }

  return (
    <>
      <NextSeo
        title={meta.title}
        description={meta.description}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: 'https://supabase.com/planner',
        }}
      />
      <DefaultLayout>
        {/* Hero section */}
        <SectionContainer className="!pb-0">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]',
                  'bg-gradient-to-b from-brand-500/5 via-brand-500/2 to-transparent',
                  'rounded-full blur-3xl'
                )}
              />
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-500 text-sm font-medium mb-4">
                <Database className="w-4 h-4" />
                Database troubleshooting
              </div>
              <h1 className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                Database Planner
              </h1>
              <p className="text-foreground-light text-base md:text-lg mt-4 max-w-xl mx-auto">
                Describe your database symptoms and we will help you find the right resources and
                solutions to get back on track.
              </p>
            </motion.div>
          </div>
        </SectionContainer>

        {/* Progress section */}
        <SectionContainer className="!py-6 md:!py-8">
          <div className="space-y-4">
            <ProgressBar progress={progress} isComplete={isSolution} />
            {!isStart && (
              <div className="flex items-center justify-between gap-4">
                <PathBreadcrumbs pathHistory={pathHistory} />
                <Button
                  type="text"
                  size="tiny"
                  onClick={reset}
                  className="text-foreground-muted hover:text-foreground flex-shrink-0"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        </SectionContainer>

        {/* Main content */}
        <SectionContainer className="!pt-0">
          <AnimatePresence mode="wait">
            {/* Symptom selection */}
            {currentView === 'symptoms' && isStart && (
              <motion.div
                key="symptoms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-foreground-light text-lg font-medium">
                    What are you experiencing?
                  </h2>
                  <p className="text-foreground-muted text-sm mt-1">
                    Select the symptom that best describes your situation
                  </p>
                </div>

                {/* Search bar */}
                <div className="max-w-md mx-auto mb-8">
                  <Input
                    icon={<Search className="w-4 h-4" />}
                    placeholder="Search symptoms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Symptoms grid with layout animations */}
                <LayoutGroup>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <AnimatePresence>
                      {symptoms
                        .filter(
                          (symptom) =>
                            searchTerm === '' ||
                            symptom.details.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            symptom.details.description
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((symptom) => (
                          <SymptomCard
                            key={symptom.id}
                            id={symptom.id}
                            details={symptom.details}
                            onSelect={selectSymptom}
                          />
                        ))}
                    </AnimatePresence>
                  </div>
                </LayoutGroup>

                {/* No results message */}
                <AnimatePresence>
                  {searchTerm &&
                    symptoms.filter(
                      (s) =>
                        s.details.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.details.description.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center py-8 text-foreground-muted"
                      >
                        No symptoms match your search. Try different keywords.
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Diagnostic questions */}
            {currentView === 'diagnostic' && currentNode && (
              <motion.div
                key={`diagnostic-${currentNode.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DiagnosticCard
                  question={currentNode.label}
                  details={diagnosticDetails}
                  options={options}
                  onSelect={selectOption}
                  onBack={goBack}
                />
              </motion.div>
            )}

            {/* Solution */}
            {currentView === 'solution' && solutionDetails && (
              <motion.div
                key={`solution-${currentNode?.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mb-3"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-foreground text-xl font-medium">
                    We have a recommendation
                  </h2>
                  <p className="text-foreground-muted text-sm mt-1">
                    Based on your answers, here is what we suggest
                  </p>
                </div>
                <SolutionCard
                  details={solutionDetails}
                  relatedSolutions={relatedSolutions}
                  onReset={reset}
                  onBack={goBack}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </SectionContainer>

        {/* Footer info */}
        <SectionContainer className="!pt-0 !pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-surface-100/50 border border-border-muted">
              <p className="text-foreground-muted text-sm">
                Need more help? Our{' '}
                <a href="/docs" className="text-brand-500 hover:text-brand-400 underline">
                  documentation
                </a>{' '}
                has detailed guides, or reach out to{' '}
                <a href="/support" className="text-brand-500 hover:text-brand-400 underline">
                  support
                </a>{' '}
                for personalized assistance.
              </p>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default PlannerPage
