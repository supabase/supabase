const config = {
  auth: {
    rate_limits: {
      email: {
        inbuilt_smtp_per_hour: {
          value: 3,
        },
      },
      magic_link: {
        tau: {
          value: 60,
          unit: 'seconds',
        },
        validity: {
          value: 1,
          unit: 'hour',
        },
      },
      otp: {
        tau: {
          value: 60,
          unit: 'seconds',
        },
        validity: {
          value: 1,
          unit: 'hour1',
        },
      },
    },
  },
} as const

export default config
