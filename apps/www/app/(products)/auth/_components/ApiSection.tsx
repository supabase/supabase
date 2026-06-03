import { createHighlighter, type ThemeRegistration } from 'shiki'
import { ApiSectionClient } from './ApiSectionClient'

const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#bda4ff' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#3ecf8e' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#3ecf8e' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#3ecf8e' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#ffcda1' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffffff' } },
    { scope: ['punctuation'], settings: { foreground: '#ffffff' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ededed' } },
  ],
}

const supabaseLight: ThemeRegistration = {
  name: 'supabase-light',
  type: 'light',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#525252',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#6b35dc' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#15593b' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#15593b' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#15593b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#f1a10d' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#525252' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
  ],
}

const LANG_MAP: Record<string, string> = {
  JavaScript: 'javascript',
  Flutter: 'dart',
  Python: 'python',
  'C#': 'csharp',
  Kotlin: 'kotlin',
  Swift: 'swift',
}

const API_EXAMPLES = [
  {
    icon: 'UserPlus' as const,
    title: 'Sign up',
    description: 'Create new accounts with email/password, phone, or third-party providers.',
    code: {
      JavaScript: `// Sign up with email and password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
})`,
      Flutter: `// Sign up with email and password
final response = await supabase.auth.signUp(
  email: 'user@example.com',
  password: 'secure-password',
);`,
      Python: `# Sign up with email and password
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "secure-password",
})`,
      'C#': `// Sign up with email and password
var session = await supabase.Auth.SignUp(
    "user@example.com",
    "secure-password"
);`,
      Kotlin: `// Sign up with email and password
supabase.auth.signUpWith(Email) {
    email = "user@example.com"
    password = "secure-password"
}`,
      Swift: `// Sign up with email and password
try await supabase.auth.signUp(
  email: "user@example.com",
  password: "secure-password"
)`,
    },
  },
  {
    icon: 'LogIn' as const,
    title: 'Sign in',
    description: 'Authenticate users with multiple strategies in a single call.',
    code: {
      JavaScript: `// Sign in with email
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign in with magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
})`,
      Flutter: `// Sign in with email
final response = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'secure-password',
);

// Sign in with magic link
await supabase.auth.signInWithOtp(
  email: 'user@example.com',
);`,
      Python: `# Sign in with email
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "secure-password",
})

# Sign in with magic link
response = supabase.auth.sign_in_with_otp({
    "email": "user@example.com",
})`,
      'C#': `// Sign in with email
var session = await supabase.Auth.SignIn(
    "user@example.com",
    "secure-password"
);

// Sign in with magic link
await supabase.Auth.SignIn(
    Constants.SignInType.MagicLink,
    "user@example.com"
);`,
      Kotlin: `// Sign in with email
supabase.auth.signInWith(Email) {
    email = "user@example.com"
    password = "secure-password"
}

// Sign in with magic link
supabase.auth.signInWith(OTP) {
    email = "user@example.com"
}`,
      Swift: `// Sign in with email
try await supabase.auth.signIn(
  email: "user@example.com",
  password: "secure-password"
)

// Sign in with magic link
try await supabase.auth.signInWithOTP(
  email: "user@example.com"
)`,
    },
  },
  {
    icon: 'Globe' as const,
    title: 'OAuth logins',
    description: 'Social login with 20+ providers and custom scopes for extended permissions.',
    code: {
      JavaScript: `// Sign in with GitHub
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    scopes: 'repo gist notifications',
  },
})`,
      Flutter: `// Sign in with GitHub
await supabase.auth.signInWithOAuth(
  OAuthProvider.github,
  scopes: 'repo gist notifications',
);`,
      Python: `# Sign in with GitHub
response = supabase.auth.sign_in_with_oauth({
    "provider": "github",
    "options": {
        "scopes": "repo gist notifications",
    },
})`,
      'C#': `// Sign in with GitHub
var session = await supabase.Auth.SignIn(
    Constants.Provider.Github,
    new SignInOptions {
        Scopes = "repo gist notifications"
    }
);`,
      Kotlin: `// Sign in with GitHub
supabase.auth.signInWith(Github) {
    scopes = "repo gist notifications"
}`,
      Swift: `// Sign in with GitHub
try await supabase.auth.signInWithOAuth(
  provider: .github,
  scopes: "repo gist notifications"
)`,
    },
  },
  {
    icon: 'KeyRound' as const,
    title: 'Session management',
    description: 'Retrieve, refresh, and manage user sessions with built-in token handling.',
    code: {
      JavaScript: `// Get the current user
const { data: { user } } = await supabase.auth.getUser()

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
})`,
      Flutter: `// Get the current user
final user = supabase.auth.currentUser;

// Listen for auth state changes
supabase.auth.onAuthStateChange.listen((data) {
  final event = data.event;
  final session = data.session;
});`,
      Python: `# Get the current user
user = supabase.auth.get_user()

# Get the current session
session = supabase.auth.get_session()`,
      'C#': `// Get the current user
var user = supabase.Auth.CurrentUser;

// Listen for auth state changes
supabase.Auth.AddStateChangedListener(
    (sender, changed) => {
        // Handle state change
    }
);`,
      Kotlin: `// Get the current user
val user = supabase.auth.currentUserOrNull()

// Listen for auth state changes
supabase.auth.sessionStatus.collect { status ->
    when (status) {
        is SessionStatus.Authenticated -> { }
        SessionStatus.NotAuthenticated -> { }
    }
}`,
      Swift: `// Get the current user
let user = try await supabase.auth.user()

// Listen for auth state changes
for await (event, session) in supabase.auth.authStateChanges {
  print(event, session)
}`,
    },
  },
]

export async function ApiSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: Object.values(LANG_MAP),
  })

  const examples = API_EXAMPLES.map((example) => ({
    icon: example.icon,
    title: example.title,
    description: example.description,
    languages: Object.fromEntries(
      Object.entries(example.code).map(([lang, code]) => [
        lang,
        {
          darkHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-dark' }),
          lightHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-light' }),
        },
      ])
    ),
  }))

  hl.dispose()

  return <ApiSectionClient examples={examples} />
}
