/**
 * Approximate style variables for the hosts we ship to, using the MCP Apps
 * standard variable names. They are stand-ins to check that views adopt a
 * host's palette and fonts, not exact copies of either product.
 */
export type HostProfile = 'claude' | 'chatgpt' | 'none'
export type Theme = 'light' | 'dark'

type Variables = Record<string, string>

const PROFILES: Record<Exclude<HostProfile, 'none'>, Record<Theme, Variables>> = {
  claude: {
    light: {
      '--color-background-primary': '#faf9f5',
      '--color-background-secondary': '#f0eee6',
      '--color-text-primary': '#141413',
      '--color-text-secondary': '#5e5d59',
      '--color-border-primary': 'rgba(31, 30, 29, 0.15)',
      '--font-sans': 'ui-sans-serif, system-ui, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    dark: {
      '--color-background-primary': '#262624',
      '--color-background-secondary': '#1f1e1d',
      '--color-text-primary': '#faf9f5',
      '--color-text-secondary': '#c2c0b6',
      '--color-border-primary': 'rgba(222, 220, 209, 0.15)',
      '--font-sans': 'ui-sans-serif, system-ui, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
  },
  chatgpt: {
    light: {
      '--color-background-primary': '#ffffff',
      '--color-background-secondary': '#f9f9f9',
      '--color-text-primary': '#0d0d0d',
      '--color-text-secondary': '#5d5d5d',
      '--color-border-primary': 'rgba(13, 13, 13, 0.1)',
      '--font-sans': 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    dark: {
      '--color-background-primary': '#212121',
      '--color-background-secondary': '#181818',
      '--color-text-primary': '#ececec',
      '--color-text-secondary': '#b4b4b4',
      '--color-border-primary': 'rgba(255, 255, 255, 0.1)',
      '--font-sans': 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
  },
}

export function hostVariables(profile: HostProfile, theme: Theme): Variables | undefined {
  return profile === 'none' ? undefined : PROFILES[profile][theme]
}

export const HOST_PROFILE_LABELS: Record<HostProfile, string> = {
  claude: 'Claude-like',
  chatgpt: 'ChatGPT-like',
  none: 'No host styles',
}
