const config = {
  auth: {
    rate_limits: {
      inbuilt_smtp: 3,
    },
  },
} as const

export default config
