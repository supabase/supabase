import {
  Database,
  FileCode,
  HardDrive,
  Key,
  Layers,
  Server,
  Shield,
  Table,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { CompositionResource } from './resources'

/**
 * Maps the `iconKey` set by resource extractors (in packages/template-composer) to a
 * Lucide icon component. Extractors choose the key; the app chooses the icon.
 * That keeps icon imports out of the shared package while still letting new
 * resource kinds light up the diagram without editing this file's consumers.
 */
const ICONS_BY_KEY: Record<string, LucideIcon> = {
  table: Table,
  schema: Layers,
  bucket: HardDrive,
  'edge-function': Server,
  db: Database,
  api: FileCode,
  auth: Key,
  storage: HardDrive,
  edge_runtime: Server,
  realtime: Zap,
  vault: Shield,
  config: FileCode,
}

export function getResourceIcon(resource: CompositionResource): LucideIcon {
  if (resource.iconKey && ICONS_BY_KEY[resource.iconKey]) {
    return ICONS_BY_KEY[resource.iconKey]
  }
  return FileCode
}
