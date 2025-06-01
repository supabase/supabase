export const REFERENCES = {
  javascript: {
    type: 'sdk',
    name: 'JavaScript',
    library: 'supabase-js',
    libPath: 'javascript',
    versions: ['v2', 'v1'],
    typeSpec: true,
    icon: 'reference-javascript',
    meta: {
      v2: {
        libId: 'reference_javascript_v2',
        specFile: 'supabase_js_v2',
      },
      v1: {
        libId: 'reference_javascript_v1',
        specFile: 'supabase_js_v1',
      },
    },
  },
  dart: {
    type: 'sdk',
    name: 'Flutter',
    library: 'supabase-dart',
    libPath: 'dart',
    versions: ['v2', 'v1'],
    icon: 'reference-dart',
    meta: {
      v2: {
        libId: 'reference_dart_v2',
        specFile: 'supabase_dart_v2',
      },
      v1: {
        libId: 'reference_dart_v1',
        specFile: 'supabase_dart_v1',
      },
    },
  },
  csharp: {
    type: 'sdk',
    name: 'C#',
    library: 'supabase-csharp',
    libPath: 'csharp',
    versions: ['v1', 'v0'],
    icon: 'reference-csharp',
    meta: {
      v1: {
        libId: 'reference_csharp_v1',
        specFile: 'supabase_csharp_v1',
      },
      v0: {
        libId: 'reference_csharp_v0',
        specFile: 'supabase_csharp_v0',
      },
    },
  },
  swift: {
    type: 'sdk',
    name: 'Swift',
    library: 'supabase-swift',
    libPath: 'swift',
    versions: ['v2', 'v1'],
    icon: 'reference-swift',
    meta: {
      v2: {
        libId: 'reference_swift_v2',
        specFile: 'supabase_swift_v2',
      },
      v1: {
        libId: 'reference_swift_v1',
        specFile: 'supabase_swift_v1',
      },
    },
  },
  kotlin: {
    type: 'sdk',
    name: 'Kotlin',
    library: 'supabase-kt',
    libPath: 'kotlin',
    versions: ['v3', 'v2', 'v1'],
    icon: 'reference-kotlin',
    meta: {
      v3: {
        libId: 'reference_kotlin_v3',
        specFile: 'supabase_kt_v3',
      },
      v2: {
        libId: 'reference_kotlin_v2',
        specFile: 'supabase_kt_v2',
      },
      v1: {
        libId: 'reference_kotlin_v1',
        specFile: 'supabase_kt_v1',
      },
    },
  },
  python: {
    type: 'sdk',
    name: 'Python',
    library: 'supabase-py',
    libPath: 'python',
    versions: ['v2'],
    icon: 'reference-python',
    meta: {
      v2: {
        libId: 'reference_python_v2',
        specFile: 'supabase_py_v2',
      },
    },
  },
  cli: {
    type: 'cli',
    name: 'CLI',
    libPath: 'cli',
    versions: [],
    icon: 'reference-cli',
  },
  api: {
    type: 'api',
    name: 'API',
    libPath: 'api',
    versions: [],
    icon: 'reference-api',
  },
  self_hosting_analytics: {
    type: 'self-hosting',
    name: 'Self-Hosting Analytics',
    libPath: 'self-hosting-analytics',
    versions: [],
    icon: 'reference-analytics',
  },
  self_hosting_auth: {
    type: 'self-hosting',
    name: 'Self-Hosting Auth',
    libPath: 'self-hosting-auth',
    versions: [],
    icon: 'self-hosting',
  },
  self_hosting_functions: {
    type: 'self-hosting',
    name: 'Self-Hosting Functions',
    libPath: 'self-hosting-functions',
    versions: [],
    icon: 'reference-functions',
  },
  self_hosting_realtime: {
    type: 'self-hosting',
    name: 'Self-Hosting Realtime',
    libPath: 'self-hosting-realtime',
    versions: [],
    icon: 'self-hosting',
  },
  self_hosting_storage: {
    type: 'self-hosting',
    name: 'Self-Hosting Storage',
    libPath: 'self-hosting-storage',
    versions: [],
    icon: 'self-hosting',
  },
} as const

export const clientSdkIds = Object.keys(REFERENCES).filter(
  (reference) => REFERENCES[reference].type === 'sdk'
)

export const selfHostingServices = Object.keys(REFERENCES).filter(
  (reference) => REFERENCES[reference].type === 'self-hosting'
)
