export const getAuthReportAttributes = (isFreePlan: boolean) => [
  {
    id: 'active-users',
    label: 'Active Users',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
    ],
  },
  {
    id: 'sign-in-attempts',
    label: 'Sign In Attempts by Type',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of sign in attempts by grant type.',
    attributes: [
      {
        attribute: 'SignInAttempts',
        provider: 'logs',
        label: 'Password',
        grantType: 'password',
        enabled: true,
      },
      {
        attribute: 'SignInAttempts',
        provider: 'logs',
        label: 'PKCE',
        grantType: 'pkce',
        enabled: true,
      },
      {
        attribute: 'SignInAttempts',
        provider: 'logs',
        label: 'Refresh Token',
        grantType: 'refresh_token',
        enabled: true,
      },
      {
        attribute: 'SignInAttempts',
        provider: 'logs',
        label: 'ID Token',
        grantType: 'id_token',
        enabled: true,
      },
    ],
  },
  {
    id: 'signups',
    label: 'Sign Ups',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of sign ups.',
    attributes: [
      {
        attribute: 'TotalSignUps',
        provider: 'logs',
        label: 'Sign Ups',
        enabled: true,
      },
    ],
  },
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
    titleTooltip: 'The total number of auth errors by status code.',
    attributes: [
      {
        attribute: 'ErrorsByStatus',
        provider: 'logs',
        label: 'Auth Errors',
      },
    ],
  },
  {
    id: 'password-reset-requests',
    label: 'Password Reset Requests',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      {
        attribute: 'PasswordResetRequests',
        provider: 'logs',
        label: 'Password Reset Requests',
        enabled: true,
      },
    ],
  },
  {
    id: 'sign-in-latency',
    label: 'Sign In Latency',
    valuePrecision: 2,
    hide: true, // Jordi: Hidden until we can fix the query
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Average latency for sign in operations by grant type.',
    attributes: [
      {
        attribute: 'SignInLatency',
        provider: 'logs',
        label: 'Password',
        grantType: 'password',
        enabled: true,
      },
      {
        attribute: 'SignInLatency',
        provider: 'logs',
        label: 'PKCE',
        grantType: 'pkce',
        enabled: true,
      },
      {
        attribute: 'SignInLatency',
        provider: 'logs',
        label: 'Refresh Token',
        grantType: 'refresh_token',
        enabled: true,
      },
      {
        attribute: 'SignInLatency',
        provider: 'logs',
        label: 'ID Token',
        grantType: 'id_token',
        enabled: true,
      },
    ],
  },
  {
    id: 'sign-up-latency',
    label: 'Sign Up Latency',
    valuePrecision: 2,
    hide: true, // Jordi: Hidden until we can fix the query
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Average latency for sign up operations by provider.',
    attributes: [
      {
        attribute: 'SignUpLatency',
        provider: 'logs',
        label: 'Email',
        providerType: 'email',
        enabled: true,
      },
      {
        attribute: 'SignUpLatency',
        provider: 'logs',
        label: 'Google',
        providerType: 'google',
        enabled: true,
      },
      {
        attribute: 'SignUpLatency',
        provider: 'logs',
        label: 'GitHub',
        providerType: 'github',
        enabled: true,
      },
      {
        attribute: 'SignUpLatency',
        provider: 'logs',
        label: 'Apple',
        providerType: 'apple',
        enabled: true,
      },
    ],
  },
]

/**
 * ================================================
 * Mock data below
 * TODO: Remove once we have real data
 * ================================================
 * */

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
