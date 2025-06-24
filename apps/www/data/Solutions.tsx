export type SolutionTypes = Solutions[keyof Solutions]

export enum Solutions {
  aiBuilders = 'ai-builders',
  neon = 'neon',
  noCode = 'no-code',
  beginners = 'beginners',
  developers = 'developers',
  postgresDevs = 'postgres-developers',
}

export const data = {
  label: 'Solutions',
  solutions: [
    {
      id: Solutions.aiBuilders,
      category: 'use-case',
      text: 'AI Builders',
      description: '',
      url: '/solutions/ai-builders',
      // icon: 'ai-builders',
    },
    {
      id: Solutions.neon,
      category: 'use-case',
      text: 'Switch from Neon',
      description: '',
      url: '/solutions/switch-from-neon',
      // icon: 'neon',
    },
    {
      id: Solutions.noCode,
      category: 'skill-level',
      text: 'No Code',
      description: '',
      url: '/solutions/no-code',
      // icon: 'no-code',
    },
    {
      id: Solutions.beginners,
      category: 'skill-level',
      text: 'For Beginners',
      description: '',
      url: '/solutions/beginners',
      // icon: 'beginners',
    },
    {
      id: Solutions.developers,
      category: 'skill-level',
      text: 'For Developers',
      description: '',
      url: '/solutions/developers',
      // icon: 'developers',
    },
    {
      id: Solutions.postgresDevs,
      category: 'skill-level',
      text: 'For Postgres Devs',
      description: '',
      url: '/solutions/postgres-developers',
      // icon: 'postgres-devs',
    },
  ],
}

export default data
