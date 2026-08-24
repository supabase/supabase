import { LUCIDE_ICONS } from '@/lib/assets/lucide-icons'
import { SEED_ICONS, type SeedIcon } from '@/lib/assets/seed-icons'

/**
 * The full built-in icon palette the app matches against and renders: the
 * original hand-authored seed icons plus the curated Lucide set
 * (lib/assets/lucide-icons.ts). Uploaded assets from Supabase are layered on
 * top at runtime (see lib/supabase/assets.ts).
 */
export const ICON_LIBRARY: SeedIcon[] = [...SEED_ICONS, ...LUCIDE_ICONS]

export const ICON_MAP: Record<string, SeedIcon> = Object.fromEntries(
  ICON_LIBRARY.map((icon) => [icon.name, icon])
)
