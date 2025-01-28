import { AnimatePresence, motion } from 'framer-motion'
import { Box, Clock, Database, File, ListOrdered, User2, Zap } from 'lucide-react'
import { memo } from 'react'

import { SchemaVisualizer } from 'components/interfaces/SchemaVisualizer'
import { BASE_PATH } from 'lib/constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

interface ProjectVisualProps {
  sqlStatements: string[]
  showInfo: boolean
  services: SupabaseService[]
  selectedRegion: {
    name: string
    location: { latitude: number; longitude: number }
    code: string
    displayName: string
  } | null
  projectDetails: {
    dbRegion: string
    cloudProvider: string
    postgresVersion: string
  }
}

const arePropsEqual = (prevProps: ProjectVisualProps, nextProps: ProjectVisualProps) => {
  return (
    prevProps.sqlStatements.length === nextProps.sqlStatements.length &&
    prevProps.showInfo === nextProps.showInfo &&
    prevProps.services.length === nextProps.services.length &&
    prevProps.selectedRegion?.name === nextProps.selectedRegion?.name &&
    prevProps.projectDetails.dbRegion === nextProps.projectDetails.dbRegion &&
    prevProps.projectDetails.cloudProvider === nextProps.projectDetails.cloudProvider &&
    prevProps.projectDetails.postgresVersion === nextProps.projectDetails.postgresVersion
  )
}

export const ProjectVisual = memo(
  ({
    sqlStatements,
    showInfo = true,
    services,
    selectedRegion,
    projectDetails,
  }: ProjectVisualProps) => {
    const variants = {
      center: {
        scale: 1,
        opacity: 1,
        top: '50%',
        right: '50%',
        x: '50%',
        y: '-70%',
      },
      corner: {
        scale: 1,
        opacity: 1,
        top: '3%',
        right: '3%',
        x: '0%',
        y: '0%',
      },
    }

    const currentVariant = showInfo ? (sqlStatements.length > 0 ? 'corner' : 'center') : 'hidden'
    return (
      <div className="flex h-full flex-1">
        <div className="flex-1 h-full relative">
          {showInfo && (
            <motion.div
              key="info"
              variants={variants}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={`hidden lg:block absolute z-30 p-4 bg-surface-100 min-w-80 rounded-lg border shadow-lg`}
              initial={{
                scale: 0.99,
                opacity: 0,
                top: '50%',
                right: '50%',
                x: '50%',
                y: '-70%',
              }}
              animate={currentVariant}
            >
              <div className="flex items-start justify-between w-80">
                <div className="flex gap-x-3">
                  <div className="flex flex-col gap-y-0.5">
                    <p className="text-sm">Primary Database</p>
                    <p className="flex items-center gap-x-1">
                      <span className="text-sm text-foreground-light">
                        {projectDetails.dbRegion}
                      </span>
                    </p>
                    <p className="flex items-center gap-x-1">
                      <span className="text-sm text-foreground-light">
                        {projectDetails.cloudProvider}
                      </span>
                      <span className="text-sm text-foreground-light">•</span>
                      <span className="text-sm text-foreground-light">
                        {projectDetails.postgresVersion}
                      </span>
                    </p>
                  </div>
                </div>
                {selectedRegion && (
                  <img
                    alt="region icon"
                    className="w-8 rounded-sm mt-0.5"
                    src={`${BASE_PATH}/img/regions/${selectedRegion.name}.svg`}
                  />
                )}
              </div>

              <TooltipProvider>
                <div className="flex gap-2 mt-4">
                  {[
                    { name: 'Auth', icon: User2 },
                    { name: 'Storage', icon: File },
                    { name: 'Database', icon: Database },
                    { name: 'Edge Function', icon: Zap },
                    { name: 'Cron', icon: Clock },
                    { name: 'Queues', icon: ListOrdered },
                    { name: 'Vector', icon: Box },
                  ].map((service) => {
                    const enabledService = services.find((s) => s.name === service.name)
                    const isEnabled = !!enabledService
                    return (
                      <Tooltip key={service.name} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                            flex items-center justify-center w-10 h-10 border rounded cursor-help
                            ${isEnabled ? 'border-brand-600 text-brand-600' : 'text-foreground-lighter'}
                          `}
                          >
                            <service.icon size={16} strokeWidth={2} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isEnabled ? `${service.name}: ${enabledService.reason}` : service.name}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </TooltipProvider>
            </motion.div>
          )}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 1 } }}
              exit={{ opacity: 0 }}
              className={`h-full z-20 ${sqlStatements.length === 0 ? 'pointer-events-none' : ''}`}
            >
              <SchemaVisualizer sqlStatements={sqlStatements} className="h-full z-20" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  },
  arePropsEqual
)

ProjectVisual.displayName = 'ProjectVisual'
