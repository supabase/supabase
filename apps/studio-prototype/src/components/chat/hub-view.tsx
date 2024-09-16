'use client'

import { Hub } from '@/src/app/chat/actions'
import { GuageIcon, LightningIcon, LockIcon } from './icons'
import { motion } from 'framer-motion'
import { scaleLinear } from 'd3-scale'

export const HubView = ({ hub }: { hub: Hub }) => {
  const countToHeight = scaleLinear().domain([0, hub.lights.length]).range([0, 32])

  return (
    <div className="flex flex-row gap-2 md:max-w-[452px] max-w-[calc(100dvw-80px)] w-full pb-6">
      <motion.div
        className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex flex-row gap-3 items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-2 bg-blue-500 text-blue-50 dark:bg-blue-300 dark:text-blue-800 rounded-md">
          <GuageIcon />
        </div>
        <div>
          <div className="text-xs">Climate</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {`${hub.climate.low}-${hub.climate.high}°C`}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex flex-row gap-3 items-center flex-shrink-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className={`relative p-2 text-zinc-50 size-8 dark:bg-zinc-200 dark:text-amber-900 rounded-md bg-zinc-300`}
        >
          <div className="size-8 absolute z-20">
            <LightningIcon />
          </div>
          <motion.div
            className={`absolute bottom-0 left-0 h-2 w-8 bg-amber-500 ${hub.lights.filter((hub) => hub.status).length === hub.lights.length ? 'rounded-md' : 'rounded-b-md'}`}
            initial={{ height: 0 }}
            animate={{
              height: countToHeight(hub.lights.filter((hub) => hub.status).length),
            }}
          />
        </div>
        <div>
          <div className="text-xs">Lights</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {`${hub.lights.filter((hub) => hub.status).length}/${hub.lights.length} On`}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md flex flex-row gap-3 items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-2 bg-green-600 text-green-100 dark:bg-green-200 dark:text-green-900 rounded-md">
          <LockIcon />
        </div>
        <div>
          <div className="text-xs">Security</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {`${hub.locks.filter((hub) => hub.isLocked).length}/${hub.locks.length} Locked`}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
