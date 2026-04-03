import { AnimatePresence, motion } from 'framer-motion'
import { cn } from 'ui'

import { FloatingScreens } from './floating/FloatingScreens'
import { MockDashboardLayout } from './layout/MockDashboardLayout'
import { useMockProject } from './providers/MockProjectContext'
import { MockProviders } from './providers/MockProviders'
import type { SupaMockProps } from './types'

export function SupaMock({
  defaultScreen = '/dashboard/project',
  className,
  projectName,
  organizationName,
  organizationPlan,
  branchName,
  organizations,
  floatingScreens = [],
}: SupaMockProps) {
  return (
    <div
      style={{ aspectRatio: '4 / 3' }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-background shadow-lg flex flex-col',
        className
      )}
    >
      <MockProviders
        defaultPath={defaultScreen}
        projectName={projectName}
        organizationName={organizationName}
        organizationPlan={organizationPlan}
        branchName={branchName}
        organizations={organizations}
      >
        <SupaMockInner floatingScreens={floatingScreens} />
      </MockProviders>
    </div>
  )
}

function SupaMockInner({
  floatingScreens,
}: {
  floatingScreens: NonNullable<SupaMockProps['floatingScreens']>
}) {
  const { dashboardReady } = useMockProject()

  return (
    <>
      <AnimatePresence mode="wait">
        {dashboardReady ? (
          <motion.div
            key="dashboard"
            className="flex flex-col flex-1 min-h-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <MockDashboardLayout />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            className="flex flex-col flex-1 min-h-0 items-center justify-center bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <IdleScreen />
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingScreens screens={floatingScreens} />
    </>
  )
}

function IdleScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      {/* Supabase logo mark */}
      <motion.div
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width="40"
          height="42"
          viewBox="0 0 109 113"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
            fill="url(#idle_linear_0)"
          />
          <path
            d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
            fill="url(#idle_linear_1)"
            fillOpacity="0.2"
          />
          <path
            d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.0434 72.2922H8.82372C0.632833 72.2922 -3.93521 62.8321 1.15799 56.4175L45.317 2.07103Z"
            fill="#3ECF8E"
          />
          <defs>
            <linearGradient
              id="idle_linear_0"
              x1="53.9738"
              y1="54.974"
              x2="94.1635"
              y2="71.8295"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#249361" />
              <stop offset="1" stopColor="#3ECF8E" />
            </linearGradient>
            <linearGradient
              id="idle_linear_1"
              x1="36.1558"
              y1="30.578"
              x2="54.4844"
              y2="65.0806"
              gradientUnits="userSpaceOnUse"
            >
              <stop />
              <stop offset="1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}
