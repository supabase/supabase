export const DUMMY_PERMISSIONS = [
  {
    title: 'Project permissions',
    description: 'On a project level, you can decide what resources your token can access.',
    permissions: [
      {
        title: 'Manage organization adming settings',
        options: ['No access', 'Read and write'],
      },
      {
        title: 'Manage organization members',
        options: ['No access', 'Read and write'],
      },
    ],
  },
  {
    title: 'Organization permissions',
    description:
      'These are your organizational permissions. Here you can decide what resources your token can access.',
    permissions: [],
  },
]
