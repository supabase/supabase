interface ResourceWarningMessage {
  // should match pathnames, ex: ('/', 'project/[ref]/auth', 'project/[ref]/database', '/project/[ref]/settings/auth')
  restrictToRoutes?: string[]

  bannerContent: {
    warning: { title: string; description: string }
    critical: { title?: string; description?: string }
    allowDismissable?: boolean
  }
  cardContent: {
    warning: { title: string; description: string }
    critical: { title?: string; description?: string }
  }
  docsUrl?: string
  buttonText?: string
  metric: string | null
}

export const RESOURCE_WARNING_MESSAGES: Record<string, ResourceWarningMessage> = {
  is_readonly_mode_enabled: {
    bannerContent: {
      warning: {
        title:
          'Your project is currently in read-only mode and is no longer accepting write requests',
        description:
          'You will need to manually override read-only mode and reduce the disk size to below 95%',
      },
      critical: {
        title:
          'Your project is currently in read-only mode and is no longer accepting write requests',
        description:
          'You will need to manually override read-only mode and reduce the disk size to below 95%',
      },
    },
    cardContent: {
      warning: {
        title: 'Project is in read-only mode',
        description: 'Database is no longer accepting write requests.',
      },
      critical: {
        title: 'Project is in read-only mode',
        description: 'Database is no longer accepting write requests.',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode',
    buttonText: 'View Compute and Disk',
    metric: 'read_only',
  },
  disk_io_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is about to deplete its Disk IO Budget, and may become unresponsive once fully exhausted',
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
      critical: {
        title: 'Your project has depleted its Disk IO Budget, and may become unresponsive',
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
    },
    cardContent: {
      warning: {
        title: 'Project is depleting its Disk IO Budget',
        description: 'It may become unresponsive if fully exhausted',
      },
      critical: {
        title: 'Project has depleted its Disk IO Budget',
        description: 'It may become unresponsive',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-disk-io',
    buttonText: 'Check usage',
    metric: 'disk_io',
  },
  disk_space_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is about to exhaust its available disk space, and may become unresponsive once fully exhausted',
        description:
          'You can opt to increase your disk size up to 200GB on the database settings page.',
      },
      critical: {
        title: 'Your project has exhausted its available disk space, and may become unresponsive',
        description:
          'You can opt to increase your disk size up to 200GB on the database settings page.',
      },
    },
    cardContent: {
      warning: {
        title: 'Project is exhausting its available disk space',
        description: 'It may become unresponsive if fully exhausted',
      },
      critical: {
        title: 'Project has exhausted its available disk space',
        description: 'It may become unresponsive',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disk-management',
    buttonText: undefined,
    metric: 'disk_space',
  },
  cpu_exhaustion: {
    bannerContent: {
      warning: {
        title: 'Your project is currently facing high CPU usage, and its performance is affected',
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
      critical: {
        title: "Your project's CPU usage is at 100% and its performance is affected",
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
    },
    cardContent: {
      warning: {
        title: 'Project has high CPU usage',
        description: `Performance is affected`,
      },
      critical: {
        title: 'Project CPU usage is at 100%',
        description: `Performance is affected`,
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-cpu',
    buttonText: 'Check usage',
    metric: 'cpu',
  },
  memory_and_swap_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is currently facing high memory usage, and its performance is affected',
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
      critical: {
        title: "Your project's memory usage is at 100%, and its performance is affected",
        description:
          'You will need to optimize your performance or upgrade your compute. Check the usage page for more recent and detailed statistics.',
      },
    },
    cardContent: {
      warning: {
        title: 'Project has high memory usage',
        description: `Performance is affected`,
      },
      critical: {
        title: 'Project memory usage is at 100%',
        description: `Performance is affected`,
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-ram',
    buttonText: 'Check usage',
    metric: 'ram',
  },
  auth_rate_limit_exhaustion: {
    // [Joel] There is no critical warning as there is no notion of critical rate limits for auth at the moment
    bannerContent: {
      warning: {
        title:
          'Your project has exceeded email rate limits in the past 24 hours and may not reliably send auth related emails to users',
        description:
          'Set up a custom SMTP and adjust rate limits where necessary to ensure that emails are sent out reliably.',
      },
      critical: {
        title: undefined,
        description: undefined,
      },
    },
    cardContent: {
      warning: {
        title: 'Your project has exceeded email rate limits',
        description: `You will need to set up a custom SMTP provider and adjust rate limits where necessary`,
      },
      critical: {
        title: undefined,
        description: undefined,
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits',
    buttonText: 'Enable Custom SMTP',
    metric: 'auth_email_rate_limit',
  },
  multiple_resource_warnings: {
    bannerContent: {
      warning: {
        title:
          'Your project is currently exhausting multiple resources, and its performance is affected',
        description:
          "Check which resources are reaching their threshold on your project's usage page.",
      },
      critical: {
        title: 'Your project has exhausted multiple resources, and its performance is affected',
        description:
          "Check which resources have reached their threshold on your project's usage page.",
      },
    },
    cardContent: {
      warning: {
        title: 'Project is exhausting multiple resources',
        description: `Performance is affected.`,
      },
      critical: {
        title: 'Project has exhausted multiple resources',
        description: `Performance is affected.`,
      },
    },
    docsUrl: undefined,
    buttonText: 'Check usage',
    metric: null,
  },
  // [Joshen] We can remove this once auth team gives the signal to
  auth_restricted_email_sending: {
    restrictToRoutes: ['/project/[ref]/auth', '/project/[ref]/settings/auth'], // project home, auth, settings
    bannerContent: {
      warning: {
        title: "Authentication emails are only sent to organization members' email addresses",
        description:
          'Set up a custom SMTP provider to handle flows like password reset which require sending emails to any user',
      },
      critical: {
        title: "Authentication emails are only sent to organization members' email addresses",
        description:
          'Set up a custom SMTP provider to handle flows like password reset which require sending emails to any user',
      },
      allowDismissable: true,
    },
    cardContent: {
      warning: {
        title: 'Auth emails are restricted',
        description:
          "Your project can only send Auth emails to your organization's members. Set up a custom SMTP provider to send Auth emails to any user",
      },
      critical: {
        title: 'Auth emails are restricted',
        description:
          "Your project can only send Auth emails to your organization's members. Set up a custom SMTP provider to send Auth emails to any user.",
      },
    },
    docsUrl: 'https://github.com/orgs/supabase/discussions/29370',
    buttonText: 'Set up custom SMTP now',
    metric: 'auth_restricted_email_sending',
  },
}
