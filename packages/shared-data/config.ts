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
         * Inverse of the frequency at which a Magic Link can be requested.
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
         * Inverse of the frequency at which an OTP can be requested.
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
          unit: 'hour1',
        },
      },
    },
  },
} as const

export default config
