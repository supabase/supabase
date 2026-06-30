const clientLibraryFeatures = [
  'Supabase',
  'PostgREST',
  'Auth',
  'Realtime',
  'Storage',
  'Edge Runtime',
] as const

type ClientLibraryFeature = (typeof clientLibraryFeatures)[number]

type ClientLibrary = {
  language: string
  group: 'Official' | 'Community'
  libraries: Record<ClientLibraryFeature, string | null>
}

type GitHubResourceSource = {
  name: string
  owner: string
  repo: string
  branch?: string
  path?: string
  externalUrl?: string
}

const clientLibraries: ClientLibrary[] = [
  {
    language: 'JavaScript (TypeScript)',
    group: 'Official',
    libraries: {
      Supabase: 'supabase-js',
      PostgREST: 'postgrest-js',
      Auth: 'auth-js',
      Realtime: 'realtime-js',
      Storage: 'storage-js',
      'Edge Runtime': 'functions-js',
    },
  },
  {
    language: 'Flutter',
    group: 'Official',
    libraries: {
      Supabase: 'supabase-flutter',
      PostgREST: 'postgrest-dart',
      Auth: 'gotrue-dart',
      Realtime: 'realtime-dart',
      Storage: 'storage-dart',
      'Edge Runtime': 'functions-dart',
    },
  },
  {
    language: 'Swift',
    group: 'Official',
    libraries: {
      Supabase: 'supabase-swift',
      PostgREST: 'postgrest-swift',
      Auth: 'auth-swift',
      Realtime: 'realtime-swift',
      Storage: 'storage-swift',
      'Edge Runtime': 'functions-swift',
    },
  },
  {
    language: 'Python',
    group: 'Official',
    libraries: {
      Supabase: 'supabase-py',
      PostgREST: 'postgrest-py',
      Auth: 'auth-py',
      Realtime: 'realtime-py',
      Storage: 'storage-py',
      'Edge Runtime': 'functions-py',
    },
  },
  {
    language: 'C#',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-csharp',
      PostgREST: 'postgrest-csharp',
      Auth: 'gotrue-csharp',
      Realtime: 'realtime-csharp',
      Storage: 'storage-csharp',
      'Edge Runtime': 'functions-csharp',
    },
  },
  {
    language: 'F#',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-fsharp',
      PostgREST: 'postgrest-fsharp',
      Auth: 'gotrue-fsharp',
      Realtime: null,
      Storage: 'storage-fsharp',
      'Edge Runtime': 'functions-fsharp',
    },
  },
  {
    language: 'Go',
    group: 'Community',
    libraries: {
      Supabase: null,
      PostgREST: 'postgrest-go',
      Auth: 'auth-go',
      Realtime: null,
      Storage: 'storage-go',
      'Edge Runtime': 'functions-go',
    },
  },
  {
    language: 'Elixir',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-ex',
      PostgREST: 'postgrest-ex',
      Auth: 'auth-ex',
      Realtime: 'realtime-ex',
      Storage: 'storage-ex',
      'Edge Runtime': 'functions-ex',
    },
  },
  {
    language: 'Java',
    group: 'Community',
    libraries: {
      Supabase: null,
      PostgREST: null,
      Auth: 'gotrue-java',
      Realtime: null,
      Storage: 'storage-java',
      'Edge Runtime': null,
    },
  },
  {
    language: 'Kotlin',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-kt',
      PostgREST: 'postgrest-kt',
      Auth: 'auth-kt',
      Realtime: 'realtime-kt',
      Storage: 'storage-kt',
      'Edge Runtime': 'functions-kt',
    },
  },
  {
    language: 'PHP',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-php',
      PostgREST: 'postgrest-php',
      Auth: 'gotrue-php',
      Realtime: 'realtime-php',
      Storage: 'storage-php',
      'Edge Runtime': 'functions-php',
    },
  },
  {
    language: 'Ruby',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-rb',
      PostgREST: 'postgrest-rb',
      Auth: null,
      Realtime: null,
      Storage: null,
      'Edge Runtime': null,
    },
  },
  {
    language: 'Rust',
    group: 'Community',
    libraries: {
      Supabase: null,
      PostgREST: 'postgrest-rs',
      Auth: 'auth-rs',
      Realtime: null,
      Storage: null,
      'Edge Runtime': null,
    },
  },
  {
    language: 'Godot Engine (GDScript)',
    group: 'Community',
    libraries: {
      Supabase: 'supabase-gdscript',
      PostgREST: 'postgrest-gdscript',
      Auth: 'gotrue-gdscript',
      Realtime: 'realtime-gdscript',
      Storage: 'storage-gdscript',
      'Edge Runtime': 'functions-gdscript',
    },
  },
]

const selfHostedProjects = [
  {
    name: 'supabase-kubernetes',
    description: 'Helm charts to deploy Supabase on Kubernetes.',
    logo: {
      alt: 'Kubernetes logo',
      color: '#326CE5',
      src: 'https://cdn.simpleicons.org/kubernetes/326CE5',
    },
  },
  {
    name: 'supabase-terraform',
    description: 'Terraform resources for self-hosting Supabase.',
    logo: {
      alt: 'Terraform logo',
      color: '#844FBA',
      src: 'https://cdn.simpleicons.org/terraform/844FBA',
    },
  },
  {
    name: 'supabase-traefik',
    description: 'Traefik configuration for self-hosted Supabase deployments.',
    logo: {
      alt: 'Traefik logo',
      color: '#24A1C1',
      src: 'https://cdn.simpleicons.org/traefikproxy/24A1C1',
    },
  },
  {
    name: 'supabase-on-aws',
    description: 'CDK and CloudFormation templates for Supabase on AWS.',
    logo: {
      alt: 'AWS logo',
      color: '#FF9900',
      src: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    },
  },
]

const utilityGroups: { heading: string; items: { name: string; description?: string }[] }[] = [
  {
    heading: 'General',
    items: [
      {
        name: 'sql-examples',
        description: 'Curated list of SQL to help you find useful script easily.',
      },
    ],
  },
  {
    heading: 'Dart + Flutter',
    items: [{ name: 'supabase-flutter-quickstart' }],
  },
  {
    heading: 'React + Next',
    items: [{ name: 'next-server-components' }],
  },
  {
    heading: 'Svelte',
    items: [
      { name: 'svelte-supabase' },
      { name: 'supabase-ui-svelte' },
      { name: 'supabase-sveltekit-example' },
      { name: 'svelte-kanban' },
    ],
  },
  {
    heading: 'Vue + Nuxt',
    items: [{ name: 'nuxt-supabase' }, { name: 'vue-supabase' }],
  },
]

const githubResourceSourceOverrides: Record<string, Omit<GitHubResourceSource, 'name'>> = {
  'supabase-js': { owner: 'supabase', repo: 'supabase-js' },
  'postgrest-js': { owner: 'supabase', repo: 'postgrest-js' },
  'auth-js': { owner: 'supabase', repo: 'auth-js' },
  'realtime-js': { owner: 'supabase', repo: 'realtime-js' },
  'storage-js': { owner: 'supabase', repo: 'storage-js' },
  'functions-js': { owner: 'supabase', repo: 'functions-js' },
  'supabase-flutter': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/supabase_flutter',
  },
  'postgrest-dart': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/postgrest',
  },
  'gotrue-dart': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/gotrue',
  },
  'realtime-dart': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/realtime_client',
  },
  'storage-dart': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/storage_client',
  },
  'functions-dart': {
    owner: 'supabase',
    repo: 'supabase-flutter',
    branch: 'main',
    path: 'packages/functions_client',
  },
  'supabase-swift': { owner: 'supabase', repo: 'supabase-swift' },
  'postgrest-swift': {
    owner: 'supabase',
    repo: 'supabase-swift',
    branch: 'main',
    path: 'Sources/PostgREST',
  },
  'auth-swift': {
    owner: 'supabase',
    repo: 'supabase-swift',
    branch: 'main',
    path: 'Sources/Auth',
  },
  'realtime-swift': {
    owner: 'supabase',
    repo: 'supabase-swift',
    branch: 'main',
    path: 'Sources/Realtime',
  },
  'storage-swift': {
    owner: 'supabase',
    repo: 'supabase-swift',
    branch: 'main',
    path: 'Sources/Storage',
  },
  'functions-swift': {
    owner: 'supabase',
    repo: 'supabase-swift',
    branch: 'main',
    path: 'Sources/Functions',
  },
  'supabase-py': { owner: 'supabase', repo: 'supabase-py' },
  'postgrest-py': { owner: 'supabase', repo: 'postgrest-py' },
  'auth-py': { owner: 'supabase', repo: 'auth-py' },
  'realtime-py': { owner: 'supabase', repo: 'realtime-py' },
  'storage-py': { owner: 'supabase', repo: 'storage-py' },
  'functions-py': { owner: 'supabase', repo: 'functions-py' },
  'postgrest-kt': {
    owner: 'supabase-community',
    repo: 'supabase-kt',
    branch: 'master',
    path: 'Postgrest',
  },
  'auth-kt': {
    owner: 'supabase-community',
    repo: 'supabase-kt',
    branch: 'master',
    path: 'Auth',
  },
  'realtime-kt': {
    owner: 'supabase-community',
    repo: 'supabase-kt',
    branch: 'master',
    path: 'Realtime',
  },
  'storage-kt': {
    owner: 'supabase-community',
    repo: 'supabase-kt',
    branch: 'master',
    path: 'Storage',
  },
  'functions-kt': {
    owner: 'supabase-community',
    repo: 'supabase-kt',
    branch: 'master',
    path: 'Functions',
  },
  'auth-rs': { owner: 'supabase-community', repo: 'supabase-auth-rs' },
  'supabase-gdscript': { owner: 'supabase-community', repo: 'godot-engine.supabase' },
}

const clientLibraryResourceNames = clientLibraries.flatMap((clientLibrary) =>
  Object.values(clientLibrary.libraries).filter((name): name is string => name !== null)
)
const selfHostedResourceNames = selfHostedProjects.map((project) => project.name)
const utilityResourceNames = utilityGroups.flatMap((group) => group.items.map((item) => item.name))

const communityResourceNames = [
  ...new Set([...clientLibraryResourceNames, ...selfHostedResourceNames, ...utilityResourceNames]),
]

function getGitHubResourceSource(name: string): GitHubResourceSource {
  const override = githubResourceSourceOverrides[name]

  return {
    name,
    owner: override?.owner ?? 'supabase-community',
    repo: override?.repo ?? name,
    branch: override?.branch,
    path: override?.path,
    externalUrl: override?.externalUrl,
  }
}

function getGitHubResourceUrl(name: string): string {
  const source = getGitHubResourceSource(name)

  if (source.externalUrl) return source.externalUrl

  const repoUrl = `https://github.com/${source.owner}/${source.repo}`

  if (!source.path) return repoUrl

  return `${repoUrl}/tree/${source.branch ?? 'main'}/${source.path}`
}

export {
  clientLibraries,
  clientLibraryFeatures,
  communityResourceNames,
  getGitHubResourceSource,
  getGitHubResourceUrl,
  selfHostedProjects,
  utilityGroups,
}
export type { ClientLibraryFeature, GitHubResourceSource }
