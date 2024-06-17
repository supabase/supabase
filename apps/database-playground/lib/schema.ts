import { z } from 'zod'

export const reportSchema = z.object({ name: z.string(), description: z.string() })
export type Report = typeof reportSchema._type

export const tabsSchema = z.enum(['diagram', 'migrations', 'seeds'])
export type TabValue = typeof tabsSchema._type
