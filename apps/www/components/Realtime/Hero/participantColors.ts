/** Tailwind CSS v3 default 500 palette — humans only; Supabruv uses brand green. */
export const COLLABORATOR_500_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
] as const

export const pickCollaboratorColor = () =>
  COLLABORATOR_500_COLORS[Math.floor(Math.random() * COLLABORATOR_500_COLORS.length)]!
