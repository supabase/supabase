export type SolutionTypes = Solutions[keyof Solutions]

export enum Solutions {
  aiBuilders = 'ai-builders',
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
    },
    {
      id: Solutions.noCode,
      category: 'skill-level',
      text: 'No Code',
      description: '',
      url: '/solutions/no-code',
    },
    {
      id: Solutions.beginners,
      category: 'skill-level',
      text: 'For Beginners',
      description: '',
      url: '/solutions/beginners',
    },
    {
      id: Solutions.developers,
      category: 'skill-level',
      text: 'For Developers',
      description: '',
      url: '/solutions/developers',
    },
    {
      id: Solutions.postgresDevs,
      category: 'skill-level',
      text: 'For Postgres Devs',
      description: '',
      url: '/solutions/postgres-developers',
    },
  ],
}

export default data
