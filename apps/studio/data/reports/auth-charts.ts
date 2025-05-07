export const getAuthReportAttributes = (isFreePlan: boolean) => [
  // User Authentication Metrics
  {
    id: 'signups-by-provider',
    label: 'Sign Ups',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of sign ups by provider.',
    attributes: [
      { attribute: 'Email', provider: 'mock', label: 'Email', enabled: true },
      { attribute: 'Phone', provider: 'mock', label: 'Phone', enabled: false },
      { attribute: 'SAML', provider: 'mock', label: 'SAML 2.0', enabled: false },
      { attribute: 'Apple', provider: 'mock', label: 'Apple', enabled: false },
      { attribute: 'Azure', provider: 'mock', label: 'Azure', enabled: false },
      { attribute: 'Bitbucket', provider: 'mock', label: 'Bitbucket', enabled: false },
      { attribute: 'Discord', provider: 'mock', label: 'Discord', enabled: false },
      { attribute: 'Facebook', provider: 'mock', label: 'Facebook', enabled: false },
      { attribute: 'Figma', provider: 'mock', label: 'Figma', enabled: false },
      { attribute: 'GitHub', provider: 'mock', label: 'GitHub', enabled: true },
      { attribute: 'GitLab', provider: 'mock', label: 'GitLab', enabled: false },
      { attribute: 'Google', provider: 'mock', label: 'Google', enabled: true },
      { attribute: 'Kakao', provider: 'mock', label: 'Kakao', enabled: false },
      { attribute: 'KeyCloak', provider: 'mock', label: 'KeyCloak', enabled: false },
      { attribute: 'LinkedIn', provider: 'mock', label: 'LinkedIn (OIDC)', enabled: false },
      { attribute: 'Notion', provider: 'mock', label: 'Notion', enabled: false },
      { attribute: 'Twitch', provider: 'mock', label: 'Twitch', enabled: false },
      { attribute: 'Twitter', provider: 'mock', label: 'Twitter', enabled: false },
      { attribute: 'Slack', provider: 'mock', label: 'Slack (OIDC)', enabled: false },
      { attribute: 'Spotify', provider: 'mock', label: 'Spotify', enabled: false },
      { attribute: 'WorkOS', provider: 'mock', label: 'WorkOS', enabled: false },
      { attribute: 'Zoom', provider: 'mock', label: 'Zoom', enabled: false },
    ],
  },
  // Active Users - Only DAU
  // {
  //   id: 'active-users',
  //   label: 'Active Users',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: false,
  //   showLegend: false,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   titleTooltip: 'The total number of active users by provider.',
  //   attributes: [
  //     { attribute: 'DAU', provider: 'mock', label: 'Daily Active Users', enabled: true },
  //   ],
  // },
  // New vs Returning
  // {
  //   id: 'user-types',
  //   label: 'New vs Returning Users',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'NewUsers', provider: 'mock', label: 'New Users' },
  //     { attribute: 'ReturningUsers', provider: 'mock', label: 'Returning Users' },
  //   ],
  // },
  // Authentication Sessions
  // {
  //   id: 'auth-sessions',
  //   label: 'Auth Sessions',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: false,
  //   showLegend: false,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   titleTooltip: 'The total number of active users by provider.',
  //   attributes: [
  //     { attribute: 'TotalSessions', provider: 'mock', label: 'Total Active Sessions' },
  //     // { attribute: 'WebSessions', provider: 'mock', label: 'Web Sessions' },
  //     // { attribute: 'MobileSessions', provider: 'mock', label: 'Mobile Sessions' },
  //   ],
  // },
  {
    id: 'auth-sessions',
    label: 'Sessions',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of auth sessions by provider.',
    attributes: [
      { attribute: 'EmailSessions', provider: 'mock', label: 'Email', enabled: true },
      { attribute: 'PhoneSessions', provider: 'mock', label: 'Phone', enabled: false },
      { attribute: 'SAMLSessions', provider: 'mock', label: 'SAML 2.0', enabled: false },
      { attribute: 'AppleSessions', provider: 'mock', label: 'Apple', enabled: false },
      { attribute: 'AzureSessions', provider: 'mock', label: 'Azure', enabled: false },
      { attribute: 'BitbucketSessions', provider: 'mock', label: 'Bitbucket', enabled: false },
      { attribute: 'DiscordSessions', provider: 'mock', label: 'Discord', enabled: false },
      { attribute: 'FacebookSessions', provider: 'mock', label: 'Facebook', enabled: false },
      { attribute: 'FigmaSessions', provider: 'mock', label: 'Figma', enabled: false },
      { attribute: 'GitHubSessions', provider: 'mock', label: 'GitHub', enabled: true },
      { attribute: 'GitLabSessions', provider: 'mock', label: 'GitLab', enabled: false },
      { attribute: 'GoogleSessions', provider: 'mock', label: 'Google', enabled: true },
      { attribute: 'KakaoSessions', provider: 'mock', label: 'Kakao', enabled: false },
      { attribute: 'KeyCloakSessions', provider: 'mock', label: 'KeyCloak', enabled: false },
      { attribute: 'LinkedInSessions', provider: 'mock', label: 'LinkedIn (OIDC)', enabled: false },
      { attribute: 'NotionSessions', provider: 'mock', label: 'Notion', enabled: false },
      { attribute: 'TwitchSessions', provider: 'mock', label: 'Twitch', enabled: false },
      { attribute: 'TwitterSessions', provider: 'mock', label: 'Twitter', enabled: false },
      { attribute: 'SlackSessions', provider: 'mock', label: 'Slack (OIDC)', enabled: false },
      { attribute: 'SpotifySessions', provider: 'mock', label: 'Spotify', enabled: false },
      { attribute: 'WorkOSSessions', provider: 'mock', label: 'WorkOS', enabled: false },
      { attribute: 'ZoomSessions', provider: 'mock', label: 'Zoom', enabled: false },
    ],
  },
  {
    id: 'churn',
    label: 'Churn',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The number of users who have deleted their account.',
    attributes: [
      { attribute: 'EmailChurn', provider: 'mock', label: 'Email', enabled: true },
      { attribute: 'PhoneChurn', provider: 'mock', label: 'Phone', enabled: false },
      { attribute: 'SAMLChurn', provider: 'mock', label: 'SAML 2.0', enabled: false },
      { attribute: 'AppleChurn', provider: 'mock', label: 'Apple', enabled: false },
      { attribute: 'AzureChurn', provider: 'mock', label: 'Azure', enabled: false },
      { attribute: 'BitbucketChurn', provider: 'mock', label: 'Bitbucket', enabled: false },
      { attribute: 'DiscordChurn', provider: 'mock', label: 'Discord', enabled: false },
      { attribute: 'FacebookChurn', provider: 'mock', label: 'Facebook', enabled: false },
      { attribute: 'FigmaChurn', provider: 'mock', label: 'Figma', enabled: false },
      { attribute: 'GitHubChurn', provider: 'mock', label: 'GitHub', enabled: true },
      { attribute: 'GitLabChurn', provider: 'mock', label: 'GitLab', enabled: false },
      { attribute: 'GoogleChurn', provider: 'mock', label: 'Google', enabled: true },
      { attribute: 'KakaoChurn', provider: 'mock', label: 'Kakao', enabled: false },
      { attribute: 'KeyCloakChurn', provider: 'mock', label: 'KeyCloak', enabled: false },
      { attribute: 'LinkedInChurn', provider: 'mock', label: 'LinkedIn (OIDC)', enabled: false },
      { attribute: 'NotionChurn', provider: 'mock', label: 'Notion', enabled: false },
      { attribute: 'TwitchChurn', provider: 'mock', label: 'Twitch', enabled: false },
      { attribute: 'TwitterChurn', provider: 'mock', label: 'Twitter', enabled: false },
      { attribute: 'SlackChurn', provider: 'mock', label: 'Slack (OIDC)', enabled: false },
      { attribute: 'SpotifyChurn', provider: 'mock', label: 'Spotify', enabled: false },
      { attribute: 'WorkOSChurn', provider: 'mock', label: 'WorkOS', enabled: false },
      { attribute: 'ZoomChurn', provider: 'mock', label: 'Zoom', enabled: false },
    ],
  },
  {
    id: 'churn-rate',
    label: 'Churn Rate',
    valuePrecision: 1,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    format: '%',
    titleTooltip: 'The percentage of users who have deleted their account.',
    attributes: [{ attribute: 'ChurnRate', provider: 'mock', label: 'Churn Rate', enabled: true }],
  },
  // Session Duration
  // {
  //   id: 'session-duration',
  //   label: 'Average Session Duration (minutes)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'AvgSessionDuration', provider: 'mock', label: 'Avg Session Duration' },
  //   ],
  // },

  // Authentication Flows
  // Password Reset Activity
  {
    id: 'password-reset',
    label: 'Password Resets',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of password resets.',
    attributes: [
      { attribute: 'PasswordResetRequests', provider: 'mock', label: 'Reset Requests' },
      { attribute: 'PasswordResetCompleted', provider: 'mock', label: 'Completed Resets' },
    ],
  },
  // Email Verification
  // {
  //   id: 'email-verification',
  //   label: 'Email Verification',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'VerificationSent', provider: 'mock', label: 'Verification Emails Sent' },
  //     { attribute: 'VerificationCompleted', provider: 'mock', label: 'Verification Completed' },
  //   ],
  // },
  // Email Verification Rates
  // {
  //   id: 'verification-rates',
  //   label: 'Verification Rates (%)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'EmailOpenRate', provider: 'mock', label: 'Email Open Rate' },
  //     { attribute: 'VerificationRate', provider: 'mock', label: 'Verification Completion Rate' },
  //   ],
  // },
  // MFA Usage
  // {
  //   id: 'mfa-usage',
  //   label: 'Multi-factor Authentication',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'MfaSMS', provider: 'mock', label: 'SMS' },
  //     { attribute: 'MfaAuthenticator', provider: 'mock', label: 'Authenticator App' },
  //     { attribute: 'MfaEmail', provider: 'mock', label: 'Email' },
  //   ],
  // },
  // MFA Adoption
  // {
  //   id: 'mfa-adoption',
  //   label: 'MFA Adoption Rate (%)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [{ attribute: 'MfaAdoptionRate', provider: 'mock', label: 'MFA Adoption Rate' }],
  // },

  // Error Analysis and Security
  // Authentication Errors
  {
    id: 'auth-errors',
    label: 'Auth Errors',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of auth errors.',
    attributes: [
      {
        attribute: 'Status403',
        provider: 'mock',
        label: '403 Forbidden',
        color: {
          light: '#FFB74D', // Orange 300
          dark: '#FFCC80', // Orange 200
        },
      },
      {
        attribute: 'Status422',
        provider: 'mock',
        label: '422 Unprocessable Entity',
        color: {
          light: '#FF9800', // Orange 500
          dark: '#FFB74D', // Orange 300
        },
      },
      {
        attribute: 'Status429',
        provider: 'mock',
        label: '429 Too Many Requests',
        color: {
          light: '#E65100', // Orange 900
          dark: '#F57C00', // Orange 700
        },
      },
      {
        attribute: 'Status500',
        provider: 'mock',
        label: '500 Internal Server Error',
        color: {
          light: '#B71C1C', // Red 900
          dark: '#D32F2F', // Red 700
        },
      },
    ],
  },
  // Error Rate by Provider
  // {
  //   id: 'provider-errors',
  //   label: 'Error Rate by Provider (%)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'EmailErrorRate', provider: 'mock', label: 'Email' },
  //     { attribute: 'GoogleErrorRate', provider: 'mock', label: 'Google' },
  //     { attribute: 'GitHubErrorRate', provider: 'mock', label: 'GitHub' },
  //     { attribute: 'FacebookErrorRate', provider: 'mock', label: 'Facebook' },
  //   ],
  // },
  // API Latency
  {
    id: 'auth-latency',
    label: 'Auth API Latency (ms)',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The average latency of auth API requests.',
    attributes: [
      { attribute: 'SignInLatency', provider: 'mock', label: 'Sign In' },
      { attribute: 'SignUpLatency', provider: 'mock', label: 'Sign Up' },
      { attribute: 'TokenRefreshLatency', provider: 'mock', label: 'Token Refresh' },
    ],
  },
  // Rate Limiting
  {
    id: 'rate-limiting',
    label: 'Rate Limiting Events',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of rate limiting events.',
    attributes: [
      { attribute: 'IPRateLimited', provider: 'mock', label: 'IP Address Rate Limited' },
      { attribute: 'UserRateLimited', provider: 'mock', label: 'User Account Rate Limited' },
      {
        attribute: 'BruteForceAttempts',
        provider: 'mock',
        label: 'Potential Brute Force Attempts',
      },
    ],
  },
  // Security Events
  // {
  //   id: 'security-events',
  //   label: 'Security Events',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'SuspiciousLogins', provider: 'mock', label: 'Suspicious Login Attempts' },
  //     { attribute: 'NewDeviceLogins', provider: 'mock', label: 'New Device Logins' },
  //     {
  //       attribute: 'PasswordBreachDetections',
  //       provider: 'mock',
  //       label: 'Password Breach Detections',
  //     },
  //   ],
  // },
  // Token Usage
  {
    id: 'token-usage',
    label: 'Token Activity',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of token activity.',
    attributes: [
      { attribute: 'TokenIssuance', provider: 'mock', label: 'Tokens Issued' },
      { attribute: 'TokenRefresh', provider: 'mock', label: 'Token Refreshes' },
      { attribute: 'TokenRevocation', provider: 'mock', label: 'Token Revocations' },
    ],
  },

  // Conversion Metrics
  // Auth Conversion Funnel
  // {
  //   id: 'auth-funnel',
  //   label: 'Auth Conversion Funnel',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'PageVisits', provider: 'mock', label: 'Page Visits' },
  //     { attribute: 'SignupStarts', provider: 'mock', label: 'Sign-up Starts' },
  //     { attribute: 'SignupCompletes', provider: 'mock', label: 'Sign-up Completes' },
  //     { attribute: 'FirstLogins', provider: 'mock', label: 'First Logins' },
  //   ],
  // },
  // Conversion Rates
  // {
  //   id: 'conversion-rates',
  //   label: 'Conversion Rates (%)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'VisitToSignupRate', provider: 'mock', label: 'Visit to Sign-up' },
  //     { attribute: 'SignupCompletionRate', provider: 'mock', label: 'Sign-up Completion' },
  //     { attribute: 'RetentionRate', provider: 'mock', label: 'User Retention' },
  //   ],
  // },
  // Onboarding Completion
  // {
  //   id: 'onboarding-completion',
  //   label: 'Onboarding Completion',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'OnboardingStarts', provider: 'mock', label: 'Onboarding Starts' },
  //     { attribute: 'ProfileCompletions', provider: 'mock', label: 'Profile Completions' },
  //     { attribute: 'VerificationCompletions', provider: 'mock', label: 'Verification Completions' },
  //   ],
  // },
  // Onboarding Time
  // {
  //   id: 'onboarding-time',
  //   label: 'Avg. Time to Complete (minutes)',
  //   valuePrecision: 1,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     {
  //       attribute: 'TimeToCompleteOnboarding',
  //       provider: 'mock',
  //       label: 'Onboarding Completion Time',
  //     },
  //   ],
  // },
]

// Time points for all mock data
const DEFAULT_TIME_POINTS = [
  '2025-05-05T13:47:23Z',
  '2025-05-05T14:47:23Z',
  '2025-05-05T15:47:23Z',
  '2025-05-05T16:47:23Z',
  '2025-05-05T17:47:23Z',
  '2025-05-05T18:47:23Z',
  '2025-05-05T19:47:23Z',
  '2025-05-05T20:47:23Z',
  '2025-05-05T21:47:23Z',
  '2025-05-05T22:47:23Z',
  '2025-05-05T23:47:23Z',
  '2025-05-06T00:47:23Z',
  '2025-05-06T01:47:23Z',
  '2025-05-06T02:47:23Z',
  '2025-05-06T03:47:23Z',
  '2025-05-06T04:47:23Z',
  '2025-05-06T05:47:23Z',
  '2025-05-06T06:47:23Z',
  '2025-05-06T07:47:23Z',
  '2025-05-06T08:47:23Z',
  '2025-05-06T09:47:23Z',
  '2025-05-06T10:47:23Z',
  '2025-05-06T11:47:23Z',
  '2025-05-06T12:47:23Z',
  '2025-05-06T13:47:23Z',
]

// Helper to generate random values with some "realistic" patterns
const generatePatternedValues = (
  length: number,
  base: number = 5,
  variance: number = 5,
  spikeProbability: number = 0.1,
  spikeMultiplier: number = 5
): number[] => {
  return Array(length)
    .fill(0)
    .map(() => {
      const hasSpike = Math.random() < spikeProbability
      const baseValue = base + Math.floor(Math.random() * variance)
      return hasSpike ? baseValue * spikeMultiplier : baseValue
    })
}

export const getAuthRequestsMockData = (provider: string) => {
  let values: number[] = []

  if (provider === 'Email') {
    values = [3, 4, 4, 5, 4, 3, 5, 6, 4, 3, 5, 5, 4, 3, 4, 5, 6, 7, 5, 15, 6, 9, 17, 8, 4]
  } else if (provider === 'Google') {
    values = [2, 1, 3, 0, 5, 2, 0, 0, 1, 2, 0, 0, 1, 2, 1, 0, 0, 0, 1, 1, 2, 4, 0, 4, 12]
  } else if (provider === 'GitHub') {
    values = [0, 0, 8, 0, 3, 0, 0, 1, 0, 0, 3, 0, 0, 0, 1, 0, 8, 4, 2, 0, 2, 1, 3, 6, 10]
  } else {
    values = Array(25).fill(0)
  }

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [provider]: values[index],
  }))

  return {
    data,
    yAxisLimit: 100,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

// Add new mock data generator for provider-specific sessions
export const getProviderSessionsMockData = (provider: string) => {
  let values: number[] = []

  // Generate higher base values for sessions compared to signups
  if (provider === 'EmailSessions') {
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 15, 8, 0.1, 2)
  } else if (provider === 'GoogleSessions') {
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 12, 6, 0.1, 2.5)
  } else if (provider === 'GitHubSessions') {
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 10, 5, 0.1, 2.2)
  } else {
    // For other providers, generate lower values
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 5, 3, 0.1, 2)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [provider]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

// Add new mock data generator for provider-specific churn rates
export const getProviderChurnMockData = (provider: string) => {
  let values: number[] = []

  // Generate realistic churn rates (typically between 2-15%)
  if (provider === 'EmailChurn') {
    // Email typically has higher churn
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 2, 10, 0.1, 5.2).map((v) =>
      Math.min(v, 20)
    )
  } else if (provider === 'GoogleChurn') {
    // Google typically has lower churn due to account persistence
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 8, 2, 0.1, 1.3).map((v) =>
      Math.min(v, 15)
    )
  } else if (provider === 'GitHubChurn') {
    // GitHub has moderate churn
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 10, 2.5, 0.1, 1.2).map((v) =>
      Math.min(v, 18)
    )
  } else {
    // Other providers have varying churn rates
    values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 9, 3, 0.1, 1.4).map((v) =>
      Math.min(v, 20)
    )
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [provider]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 20, // Max 20% churn rate
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

// Add new mock data generator for churn rates
export const getChurnRateMockData = (attribute: string) => {
  let values: number[] = []

  // Overall churn rate with some variance
  values = generatePatternedValues(DEFAULT_TIME_POINTS.length, 0.6, 2, 0.15, 2.6)
    .map((v) => Math.max(0, v - 0.25)) // Allow some values to go to 0
    .map((v) => Math.min(v, 3.2))

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [attribute]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 1.5, // Max 1.5% churn rate
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

// Mock data generators for new charts
export const getActiveUsersMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  // Generate more realistic pattern for Daily Active Users
  // Create 30 days of data for a better view
  const thirtyDays = 30
  const thirtyDayDates = Array(thirtyDays)
    .fill(0)
    .map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (thirtyDays - i - 1))
      return date.toISOString()
    })

  // Base values that reflect a gradual growth trend
  const baseValue = 200
  const dailyGrowth = 1.5 // Small daily growth factor

  if (metric === 'DAU') {
    values = Array(thirtyDays)
      .fill(0)
      .map((_, i) => {
        const dayOfWeek = new Date(thirtyDayDates[i]).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        // Base value with growth trend
        let value = baseValue + i * dailyGrowth

        // Weekday/weekend pattern (weekends have ~20% less activity)
        if (isWeekend) {
          value = value * 0.8
        }

        // Add some randomness
        const randomFactor = 0.9 + Math.random() * 0.2 // ±10%
        value = value * randomFactor

        return Math.round(value)
      })
  } else {
    // For WAU and MAU (not used in this case)
    values = Array(thirtyDays).fill(0)
  }

  const data = thirtyDayDates.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getUserTypesMockData = (type: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (type === 'NewUsers') {
    values = generatePatternedValues(length, 40, 20, 0.15, 3)
  } else if (type === 'ReturningUsers') {
    values = generatePatternedValues(length, 200, 50, 0.1, 1.5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [type]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getAuthSessionsMockData = (sessionType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (sessionType === 'TotalSessions') {
    values = generatePatternedValues(length, 1200, 300, 0.1, 1.3)
  } else if (sessionType === 'WebSessions') {
    values = generatePatternedValues(length, 800, 200, 0.1, 1.4)
  } else if (sessionType === 'MobileSessions') {
    values = generatePatternedValues(length, 400, 150, 0.12, 1.5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [sessionType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getSessionDurationMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  // Session duration in minutes following a relatively stable pattern
  const values = generatePatternedValues(length, 15, 5, 0.05, 1.5)

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

// Mock data generators for authentication flows
export const getPasswordResetMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (metric === 'PasswordResetRequests') {
    values = generatePatternedValues(length, 25, 15, 0.1, 2)
  } else if (metric === 'PasswordResetCompleted') {
    values = generatePatternedValues(length, 18, 10, 0.1, 1.5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getEmailVerificationMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (metric === 'VerificationSent') {
    values = generatePatternedValues(length, 50, 20, 0.12, 1.8)
  } else if (metric === 'VerificationCompleted') {
    values = generatePatternedValues(length, 35, 15, 0.1, 1.5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getVerificationRatesMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (metric === 'EmailOpenRate') {
    // Email open rates between 50-80%
    values = generatePatternedValues(length, 65, 15, 0.05, 1.2).map((v) => Math.min(v, 100))
  } else if (metric === 'VerificationRate') {
    // Verification completion rates between 60-90%
    values = generatePatternedValues(length, 75, 15, 0.05, 1.1).map((v) => Math.min(v, 100))
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 100, // Percentage chart
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

export const getMfaUsageMockData = (method: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (method === 'MfaSMS') {
    values = generatePatternedValues(length, 15, 8, 0.1, 1.5)
  } else if (method === 'MfaAuthenticator') {
    values = generatePatternedValues(length, 25, 10, 0.1, 1.4)
  } else if (method === 'MfaEmail') {
    values = generatePatternedValues(length, 10, 5, 0.1, 1.6)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [method]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getMfaAdoptionMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  // MFA adoption between 15-35%
  const values = generatePatternedValues(length, 25, 10, 0.05, 1.2).map((v) => Math.min(v, 100))

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 100, // Percentage chart
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

// Error Analysis and Security charts
export const getErrorSecurityChartAttributes = () => [
  // Authentication Errors
  {
    id: 'auth-errors',
    label: 'Auth Error Status Codes',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of auth errors.',
    attributes: [
      {
        attribute: 'Status403',
        provider: 'mock',
        label: '403 Forbidden',
        color: {
          light: '#FFB74D', // Orange 300
          dark: '#FFCC80', // Orange 200
        },
      },
      {
        attribute: 'Status422',
        provider: 'mock',
        label: '422 Unprocessable Entity',
        color: {
          light: '#FF9800', // Orange 500
          dark: '#FFB74D', // Orange 300
        },
      },
      {
        attribute: 'Status429',
        provider: 'mock',
        label: '429 Too Many Requests',
        color: {
          light: '#E65100', // Orange 900
          dark: '#F57C00', // Orange 700
        },
      },
      {
        attribute: 'Status500',
        provider: 'mock',
        label: '500 Internal Server Error',
        color: {
          light: '#B71C1C', // Red 900
          dark: '#D32F2F', // Red 700
        },
      },
    ],
  },
  // Error Rate by Provider
  {
    id: 'provider-errors',
    label: 'Error Rate by Provider (%)',
    valuePrecision: 1,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'EmailErrorRate', provider: 'mock', label: 'Email' },
      { attribute: 'GoogleErrorRate', provider: 'mock', label: 'Google' },
      { attribute: 'GitHubErrorRate', provider: 'mock', label: 'GitHub' },
      { attribute: 'FacebookErrorRate', provider: 'mock', label: 'Facebook' },
    ],
  },
  // Rate Limiting
  // {
  //   id: 'rate-limiting',
  //   label: 'Rate Limiting Events',
  //   valuePrecision: 0,
  //   hide: false,
  //   showTooltip: true,
  //   showLegend: true,
  //   showMaxValue: false,
  //   hideChartType: false,
  //   defaultChartStyle: 'bar',
  //   attributes: [
  //     { attribute: 'IPRateLimited', provider: 'mock', label: 'IP Address Rate Limited' },
  //     { attribute: 'UserRateLimited', provider: 'mock', label: 'User Account Rate Limited' },
  //     {
  //       attribute: 'BruteForceAttempts',
  //       provider: 'mock',
  //       label: 'Potential Brute Force Attempts',
  //     },
  //   ],
  // },
  // API Latency
  {
    id: 'auth-latency',
    label: 'Auth API Latency (ms)',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'SignInLatency', provider: 'mock', label: 'Sign In' },
      { attribute: 'SignUpLatency', provider: 'mock', label: 'Sign Up' },
      { attribute: 'TokenRefreshLatency', provider: 'mock', label: 'Token Refresh' },
    ],
  },
  // Security Events
  {
    id: 'security-events',
    label: 'Security Events',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'SuspiciousLogins', provider: 'mock', label: 'Suspicious Login Attempts' },
      { attribute: 'NewDeviceLogins', provider: 'mock', label: 'New Device Logins' },
      {
        attribute: 'PasswordBreachDetections',
        provider: 'mock',
        label: 'Password Breach Detections',
      },
    ],
  },
  // Token Usage
  {
    id: 'token-usage',
    label: 'Token Activity',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'TokenIssuance', provider: 'mock', label: 'Tokens Issued' },
      { attribute: 'TokenRefresh', provider: 'mock', label: 'Token Refreshes' },
      { attribute: 'TokenRevocation', provider: 'mock', label: 'Token Revocations' },
    ],
  },
]

// Mock data generators for error and security charts
export const getAuthErrorsMockData = (errorType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (errorType === 'Status403') {
    // 403 Forbidden - Relatively uncommon
    values = generatePatternedValues(length, 1, 1, 0.05, 3)
  } else if (errorType === 'Status422') {
    // 422 Unprocessable Entity - More common validation errors
    values = generatePatternedValues(length, 8, 5, 0.12, 2)
  } else if (errorType === 'Status429') {
    // 429 Too Many Requests - Rate limiting, can be spiky
    values = generatePatternedValues(length, 3, 2, 0.15, 4)
  } else if (errorType === 'Status500') {
    // 500 Internal Server Error - Server errors, usually low but impactful
    values = generatePatternedValues(length, 1, 1, 0.08, 5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [errorType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getProviderErrorRateMockData = (provider: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  // Error rates between 0.5-8%
  if (provider === 'EmailErrorRate') {
    values = generatePatternedValues(length, 2.5, 2, 0.15, 2).map((v) => Math.min(v, 10))
  } else if (provider === 'GoogleErrorRate') {
    values = generatePatternedValues(length, 1.2, 1, 0.1, 2.5).map((v) => Math.min(v, 10))
  } else if (provider === 'GitHubErrorRate') {
    values = generatePatternedValues(length, 1.5, 1.2, 0.12, 2.2).map((v) => Math.min(v, 10))
  } else if (provider === 'FacebookErrorRate') {
    values = generatePatternedValues(length, 2, 1.5, 0.1, 2).map((v) => Math.min(v, 10))
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [provider]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 10, // Percentage chart
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

export const getRateLimitingMockData = (eventType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (eventType === 'IPRateLimited') {
    values = generatePatternedValues(length, 4, 3, 0.1, 4)
  } else if (eventType === 'UserRateLimited') {
    values = generatePatternedValues(length, 2, 2, 0.08, 3)
  } else if (eventType === 'BruteForceAttempts') {
    values = generatePatternedValues(length, 1, 1, 0.05, 5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [eventType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getAuthLatencyMockData = (operationType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (operationType === 'SignInLatency') {
    values = generatePatternedValues(length, 180, 50, 0.1, 1.5)
  } else if (operationType === 'SignUpLatency') {
    values = generatePatternedValues(length, 250, 70, 0.1, 1.4)
  } else if (operationType === 'TokenRefreshLatency') {
    values = generatePatternedValues(length, 120, 40, 0.1, 1.6)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [operationType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(0)),
    total,
  }
}

export const getSecurityEventsMockData = (eventType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (eventType === 'SuspiciousLogins') {
    values = generatePatternedValues(length, 3, 2, 0.1, 3)
  } else if (eventType === 'NewDeviceLogins') {
    values = generatePatternedValues(length, 15, 8, 0.1, 1.5)
  } else if (eventType === 'PasswordBreachDetections') {
    values = generatePatternedValues(length, 1, 1, 0.05, 5)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [eventType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getTokenUsageMockData = (metricType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (metricType === 'TokenIssuance') {
    values = generatePatternedValues(length, 100, 40, 0.1, 1.5)
  } else if (metricType === 'TokenRefresh') {
    values = generatePatternedValues(length, 400, 100, 0.1, 1.3)
  } else if (metricType === 'TokenRevocation') {
    values = generatePatternedValues(length, 30, 15, 0.1, 2)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metricType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

// Conversion Metrics charts
export const getConversionMetricsChartAttributes = () => [
  // Auth Conversion Funnel
  {
    id: 'auth-funnel',
    label: 'Auth Conversion Funnel',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'PageVisits', provider: 'mock', label: 'Page Visits' },
      { attribute: 'SignupStarts', provider: 'mock', label: 'Sign-up Starts' },
      { attribute: 'SignupCompletes', provider: 'mock', label: 'Sign-up Completes' },
      { attribute: 'FirstLogins', provider: 'mock', label: 'First Logins' },
    ],
  },
  // Conversion Rates
  {
    id: 'conversion-rates',
    label: 'Conversion Rates (%)',
    valuePrecision: 1,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'VisitToSignupRate', provider: 'mock', label: 'Visit to Sign-up' },
      { attribute: 'SignupCompletionRate', provider: 'mock', label: 'Sign-up Completion' },
      { attribute: 'RetentionRate', provider: 'mock', label: 'User Retention' },
    ],
  },
  // Onboarding Completion
  {
    id: 'onboarding-completion',
    label: 'Onboarding Completion',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'OnboardingStarts', provider: 'mock', label: 'Onboarding Starts' },
      { attribute: 'ProfileCompletions', provider: 'mock', label: 'Profile Completions' },
      { attribute: 'VerificationCompletions', provider: 'mock', label: 'Verification Completions' },
    ],
  },
  // Onboarding Time
  {
    id: 'onboarding-time',
    label: 'Avg. Time to Complete (minutes)',
    valuePrecision: 1,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      {
        attribute: 'TimeToCompleteOnboarding',
        provider: 'mock',
        label: 'Onboarding Completion Time',
      },
    ],
  },
]

// Mock data generators for conversion metrics
export const getAuthFunnelMockData = (stage: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (stage === 'PageVisits') {
    values = generatePatternedValues(length, 500, 200, 0.1, 1.5)
  } else if (stage === 'SignupStarts') {
    values = generatePatternedValues(length, 120, 50, 0.1, 1.4)
  } else if (stage === 'SignupCompletes') {
    values = generatePatternedValues(length, 80, 30, 0.1, 1.3)
  } else if (stage === 'FirstLogins') {
    values = generatePatternedValues(length, 75, 25, 0.1, 1.3)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [stage]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getConversionRatesMockData = (rateType: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (rateType === 'VisitToSignupRate') {
    // Visit to signup: 20-30%
    values = generatePatternedValues(length, 25, 5, 0.1, 1.2).map((v) => Math.min(v, 40))
  } else if (rateType === 'SignupCompletionRate') {
    // Signup completion: 60-80%
    values = generatePatternedValues(length, 70, 10, 0.1, 1.1).map((v) => Math.min(v, 90))
  } else if (rateType === 'RetentionRate') {
    // 7-day retention: 40-60%
    values = generatePatternedValues(length, 50, 10, 0.1, 1.1).map((v) => Math.min(v, 75))
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [rateType]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: 100, // Percentage chart
    format: '%',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

export const getOnboardingCompletionMockData = (stage: string) => {
  const length = DEFAULT_TIME_POINTS.length
  let values: number[] = []

  if (stage === 'OnboardingStarts') {
    values = generatePatternedValues(length, 70, 25, 0.1, 1.4)
  } else if (stage === 'ProfileCompletions') {
    values = generatePatternedValues(length, 50, 20, 0.1, 1.3)
  } else if (stage === 'VerificationCompletions') {
    values = generatePatternedValues(length, 40, 15, 0.1, 1.3)
  } else {
    values = Array(length).fill(0)
  }

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [stage]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(2)),
    total,
  }
}

export const getOnboardingTimeMockData = (metric: string) => {
  const length = DEFAULT_TIME_POINTS.length
  // Onboarding time in minutes, generally 5-15 minutes
  const values = generatePatternedValues(length, 10, 5, 0.1, 1.3)

  const data = DEFAULT_TIME_POINTS.map((time, index) => ({
    period_start: time,
    [metric]: values[index],
  }))

  const total = values.reduce((sum, val) => sum + val, 0)
  const totalAverage = total / values.length

  return {
    data,
    yAxisLimit: Math.max(...values) * 1.2,
    format: '',
    totalAverage: parseFloat(totalAverage.toFixed(1)),
    total,
  }
}

// Master mock data resolver - routes to the appropriate data generator based on attribute
export const getMockDataForAttribute = (attribute: string) => {
  // Auth Requests (original chart)
  if (
    [
      'Email',
      'Google',
      'GitHub',
      'Phone',
      'SAML',
      'Apple',
      'Azure',
      'Bitbucket',
      'Discord',
      'Facebook',
      'Figma',
      'GitLab',
      'Kakao',
      'KeyCloak',
      'LinkedIn',
      'Notion',
      'Twitch',
      'Twitter',
      'Slack',
      'Spotify',
      'WorkOS',
      'Zoom',
    ].includes(attribute)
  ) {
    return getAuthRequestsMockData(attribute)
  }

  // Provider-specific sessions
  if (
    [
      'EmailSessions',
      'PhoneSessions',
      'SAMLSessions',
      'AppleSessions',
      'AzureSessions',
      'BitbucketSessions',
      'DiscordSessions',
      'FacebookSessions',
      'FigmaSessions',
      'GitHubSessions',
      'GitLabSessions',
      'GoogleSessions',
      'KakaoSessions',
      'KeyCloakSessions',
      'LinkedInSessions',
      'NotionSessions',
      'TwitchSessions',
      'TwitterSessions',
      'SlackSessions',
      'SpotifySessions',
      'WorkOSSessions',
      'ZoomSessions',
    ].includes(attribute)
  ) {
    return getProviderSessionsMockData(attribute)
  }

  // Provider-specific churn
  if (
    [
      'EmailChurn',
      'PhoneChurn',
      'SAMLChurn',
      'AppleChurn',
      'AzureChurn',
      'BitbucketChurn',
      'DiscordChurn',
      'FacebookChurn',
      'FigmaChurn',
      'GitHubChurn',
      'GitLabChurn',
      'GoogleChurn',
      'KakaoChurn',
      'KeyCloakChurn',
      'LinkedInChurn',
      'NotionChurn',
      'TwitchChurn',
      'TwitterChurn',
      'SlackChurn',
      'SpotifyChurn',
      'WorkOSChurn',
      'ZoomChurn',
    ].includes(attribute)
  ) {
    return getProviderChurnMockData(attribute)
  }

  // Overall churn rate
  if (attribute === 'ChurnRate') {
    return getChurnRateMockData(attribute)
  }

  // Active Users charts
  if (['DAU', 'WAU', 'MAU'].includes(attribute)) {
    return getActiveUsersMockData(attribute)
  }

  // User Types charts
  if (['NewUsers', 'ReturningUsers'].includes(attribute)) {
    return getUserTypesMockData(attribute)
  }

  // Auth Sessions charts
  if (['TotalSessions', 'WebSessions', 'MobileSessions'].includes(attribute)) {
    return getAuthSessionsMockData(attribute)
  }

  // Session Duration
  if (attribute === 'AvgSessionDuration') {
    return getSessionDurationMockData(attribute)
  }

  // Password Reset metrics
  if (['PasswordResetRequests', 'PasswordResetCompleted'].includes(attribute)) {
    return getPasswordResetMockData(attribute)
  }

  // Email Verification metrics
  if (['VerificationSent', 'VerificationCompleted'].includes(attribute)) {
    return getEmailVerificationMockData(attribute)
  }

  // Verification Rates
  if (['EmailOpenRate', 'VerificationRate'].includes(attribute)) {
    return getVerificationRatesMockData(attribute)
  }

  // MFA Usage
  if (['MfaSMS', 'MfaAuthenticator', 'MfaEmail'].includes(attribute)) {
    return getMfaUsageMockData(attribute)
  }

  // MFA Adoption Rate
  if (attribute === 'MfaAdoptionRate') {
    return getMfaAdoptionMockData(attribute)
  }

  // Auth Errors
  if (['Status403', 'Status422', 'Status429', 'Status500'].includes(attribute)) {
    return getAuthErrorsMockData(attribute)
  }

  // Provider Error Rates
  if (
    ['EmailErrorRate', 'GoogleErrorRate', 'GitHubErrorRate', 'FacebookErrorRate'].includes(
      attribute
    )
  ) {
    return getProviderErrorRateMockData(attribute)
  }

  // Rate Limiting
  if (['IPRateLimited', 'UserRateLimited', 'BruteForceAttempts'].includes(attribute)) {
    return getRateLimitingMockData(attribute)
  }

  // Auth Latency
  if (['SignInLatency', 'SignUpLatency', 'TokenRefreshLatency'].includes(attribute)) {
    return getAuthLatencyMockData(attribute)
  }

  // Security Events
  if (['SuspiciousLogins', 'NewDeviceLogins', 'PasswordBreachDetections'].includes(attribute)) {
    return getSecurityEventsMockData(attribute)
  }

  // Token Usage
  if (['TokenIssuance', 'TokenRefresh', 'TokenRevocation'].includes(attribute)) {
    return getTokenUsageMockData(attribute)
  }

  // Auth Funnel
  if (['PageVisits', 'SignupStarts', 'SignupCompletes', 'FirstLogins'].includes(attribute)) {
    return getAuthFunnelMockData(attribute)
  }

  // Conversion Rates
  if (['VisitToSignupRate', 'SignupCompletionRate', 'RetentionRate'].includes(attribute)) {
    return getConversionRatesMockData(attribute)
  }

  // Onboarding Completion
  if (['OnboardingStarts', 'ProfileCompletions', 'VerificationCompletions'].includes(attribute)) {
    return getOnboardingCompletionMockData(attribute)
  }

  // Onboarding Time
  if (attribute === 'TimeToCompleteOnboarding') {
    return getOnboardingTimeMockData(attribute)
  }

  // Default fallback
  return {
    data: DEFAULT_TIME_POINTS.map((time) => ({ period_start: time, [attribute]: 0 })),
    yAxisLimit: 10,
    format: '',
    totalAverage: 0,
    total: 0,
  }
}
