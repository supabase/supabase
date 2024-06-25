export type Branch = {
  name: string
  key: string
  type: 'prod' | 'preview' | 'long-running'
}

export type Project = {
  name: string
  key: string
  github: undefined | string
  vercel: undefined | string
  branching: boolean
  branches: Branch[]
}

export type Org = {
  name: string
  key: string
  projects: Project[]
}

export const orgs: Org[] = [
  {
    name: 'SummersMuir',
    key: 'summersmuir',
    projects: [
      {
        name: 'Sonsing',
        key: 'sonsing',
        github: 'summersmuir/sonsing-repo',
        vercel: 'sonsing-vercel',
        branching: true,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
        ],
      },
    ],
  },
  {
    name: 'Tech Innovators',
    key: 'tech-innovators',
    projects: [
      {
        name: 'Alpha Platform',
        key: 'alpha-platform',
        github: 'tech-innovators/alpha-platform-repo',
        vercel: 'alpha-platform-vercel',
        branching: true,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
          {
            name: 'feature-1',
            key: 'feature-1',
            type: 'preview',
          },
          {
            name: 'hotfix-1',
            key: 'hotfix-1',
            type: 'preview',
          },
        ],
      },
      {
        name: 'Beta Application',
        key: 'beta-application',
        github: undefined,
        vercel: undefined,
        branching: false,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'staging',
            key: 'staging',
            type: 'preview',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
        ],
      },
    ],
  },
  {
    name: 'Digital Solutions',
    key: 'digital-solutions',
    projects: [
      {
        name: 'Gamma Service',
        key: 'gamma-service',
        github: 'digital-solutions/gamma-service-repo',
        vercel: 'gamma-service-vercel',
        branching: true,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
          {
            name: 'experiment-1',
            key: 'experiment-1',
            type: 'preview',
          },
        ],
      },
      {
        name: 'Delta Project',
        key: 'delta-project',
        github: undefined,
        vercel: undefined,
        branching: false,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'testing',
            key: 'testing',
            type: 'preview',
          },
        ],
      },
    ],
  },
  {
    name: 'NextGen Enterprises',
    key: 'nextgen-enterprises',
    projects: [
      {
        name: 'Omega Platform',
        key: 'omega-platform',
        github: 'nextgen-enterprises/omega-platform-repo',
        vercel: 'omega-platform-vercel',
        branching: true,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
          {
            name: 'feature-xyz',
            key: 'feature-xyz',
            type: 'preview',
          },
        ],
      },
      {
        name: 'Zeta System',
        key: 'zeta-system',
        github: undefined,
        vercel: 'zeta-system-vercel',
        branching: false,
        branches: [
          {
            name: 'main',
            key: 'main',
            type: 'prod',
          },
          {
            name: 'dev',
            key: 'dev',
            type: 'long-running',
          },
          {
            name: 'hotfix-2',
            key: 'hotfix-2',
            type: 'preview',
          },
        ],
      },
    ],
  },
]
