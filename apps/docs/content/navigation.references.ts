export const REFERENCES = {
  javascript: {
    type: 'sdk',
    name: 'JavaScript',
    library: 'supabase-js',
    libPath: 'javascript',
    versions: ['v2', 'v1'],
    typeSpec: true,
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
    versions: ['v2', 'v1'],
    meta: {
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
    versions: [],
  },
  api: {
    type: 'api',
    name: 'API',
    versions: [],
    icon: '/docs/img/icons/api-icon.svg',
  },
} as const

export const clientSdkIds = Object.keys(REFERENCES).filter(
  (reference) => REFERENCES[reference].type === 'sdk'
)
