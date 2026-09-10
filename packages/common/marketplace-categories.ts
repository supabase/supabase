import {
  BarChart3,
  Boxes,
  Cable,
  Cpu,
  CreditCard,
  Database,
  Fingerprint,
  KeyRound,
  Mail,
  MessageSquare,
  MousePointerClick,
  Package2,
  Server,
  ShieldCheck,
  Webhook,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Maps integration category slugs to Lucide icons.
 * Used in both Supabase Studio's Dashboard Integrations and the public Partner Catalog.
 * Unknown slugs fall back to the neutral Boxes icon.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  observability: BarChart3,
  security: ShieldCheck,
  billing: CreditCard,
  secrets: KeyRound,
  email: Mail,
  wrappers: Database,
  ai: Cpu,
  ai_vectors: Cpu,
  storage: Package2,
  postgres_extension: Database,
  wrapper: Cable,
  devtools: Wrench,
  auth: Fingerprint,
  'low-code': MousePointerClick,
  'data-platform': Server,
  api: Webhook,
  'caching-offline-first': Zap,
  messaging: MessageSquare,
  'foreign-data-wrapper': Cable,
  fdw: Cable,
}

export const getCategoryIcon = (slug: string | null | undefined): LucideIcon => {
  if (!slug) return Boxes
  return CATEGORY_ICONS[slug] ?? Boxes
}
