export const styles = [
  {
    name: 'default',
    label: 'Default',
  },
] as const

export type Style = (typeof styles)[number]
