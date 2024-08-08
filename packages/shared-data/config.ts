const config = {
  auth: {
    rate_limits: {
      email: {
        /**
         * The number of emails that can be sent per hour using the inbuilt email server.
         */
        inbuilt_smtp_per_hour: {
          value: 3,
        },
      },
      magic_link: {
        /**
         * Wait time between requests.
         */
        period: {
          value: 60,
          unit: 'seconds',
        },
        /**
         * How long before a Magic Link expires.
         */
        validity: {
          value: 1,
          unit: 'hour',
        },
      },
      otp: {
        /**
         * Wait time between requests.
         */
        period: {
          value: 60,
          unit: 'seconds',
        },
        /**
         * How long before an OTP expires.
         */
        validity: {
          value: 1,
          unit: 'hour',
        },
        /**
         * How many OTPs can be requested per hour.
         */
        requests_per_hour: {
          value: 30,
        },
      },
      signup_confirmation: {
        /**
         * Wait time between requests.
         */
        period: {
          value: 60,
          unit: 'seconds',
        },
      },
      password_reset: {
        /**
         * Wait time between requests.
         */
        period: {
          value: 60,
          unit: 'seconds',
        },
      },
      verification: {
        requests_per_hour: {
          value: 360,
        },
        requests_burst: {
          value: 30,
        },
      },
      token_refresh: {
        requests_per_hour: {
          value: 1800,
        },
        requests_burst: {
          value: 30,
        },
      },
      mfa: {
        requests_per_hour: {
          value: 15,
        },
        requests_burst: {
          value: 30,
        },
      },
      anonymous_signin: {
        requests_per_hour: {
          value: 30,
        },
        requests_burst: {
          value: 30,
        },
      },
    },
  },
  branching: {
    inactivity_period_in_minutes: {
      value: 5,
    },
  },
  pausing: {
    /**
     * Inactivity period after which projects may be paused.
     */
    free_tier: {
      value: '1',
      unit: 'week'
    }
  }
} as const

export default config
