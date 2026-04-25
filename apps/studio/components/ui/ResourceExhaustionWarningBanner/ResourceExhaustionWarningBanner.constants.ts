import { DOCS_URL } from '@/lib/constants'

interface ResourceWarningMessage {
  // should match pathnames, ex: ('/', 'project/[ref]/auth', 'project/[ref]/database', '/project/[ref]/settings/api')
  restrictToRoutes?: string[]

  bannerContent: {
    warning: { title: string; description: string }
    critical: { title?: string; description?: string }
  }
  cardContent: {
    warning: { title: string; description: string }
    critical: { title?: string; description?: string }
  }
  docsUrl?: string
  buttonText?: string
  aiPrompt?: string
  metric: string | null
}

type ResourceWarningMessages = Record<string, ResourceWarningMessage>

export const RESOURCE_WARNING_MESSAGES: ResourceWarningMessages = {
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
    docsUrl: `${DOCS_URL}/guides/platform/database-size#disabling-read-only-mode`,
    buttonText: 'Manage disk',
    metric: 'read_only',
  },
  disk_io_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is about to deplete its Disk IO Budget, and may become unresponsive once fully exhausted',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize disk-intensive queries.',
      },
      critical: {
        title: 'Your project has depleted its Disk IO Budget, and may become unresponsive',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize disk-intensive queries.',
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
    docsUrl: `${DOCS_URL}/guides/troubleshooting/exhaust-disk-io`,
    buttonText: 'Upgrade compute',
    aiPrompt:
      'My database is running out of Disk IO budget. Can you query pg_stat_statements to find the top queries by shared blocks read and written, identify which are causing the most disk I/O, and suggest specific optimizations to reduce disk usage?',
    metric: 'disk_io',
  },
  disk_space_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is about to exhaust its available disk space, and may become unresponsive once fully exhausted',
        description:
          'You can opt to increase your disk size up to 200GB on the Database Settings page.',
      },
      critical: {
        title: 'Your project has exhausted its available disk space, and may become unresponsive',
        description:
          'You can opt to increase your disk size up to 200GB on the Database Settings page.',
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
    docsUrl: `${DOCS_URL}/guides/platform/database-size#disk-management`,
    buttonText: undefined,
    metric: 'disk_space',
  },
  cpu_exhaustion: {
    bannerContent: {
      warning: {
        title: 'Your project is currently facing high CPU usage, and its performance is affected',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize CPU-intensive queries.',
      },
      critical: {
        title: "Your project's CPU usage is at 100% and its performance is affected",
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize CPU-intensive queries.',
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
    docsUrl: `${DOCS_URL}/guides/troubleshooting/high-cpu-usage`,
    buttonText: 'Upgrade compute',
    aiPrompt:
      'My database is experiencing high CPU usage. Can you query pg_stat_statements to find the top queries by total execution time and mean execution time, identify which are most CPU-intensive, and suggest specific optimizations such as missing indexes or query rewrites to reduce CPU load?',
    metric: 'cpu',
  },
  memory_and_swap_exhaustion: {
    bannerContent: {
      warning: {
        title:
          'Your project is currently facing high memory usage, and its performance is affected',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize memory-intensive queries.',
      },
      critical: {
        title: "Your project's memory usage is at 100%, and its performance is affected",
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize memory-intensive queries.',
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
    docsUrl: `${DOCS_URL}/guides/troubleshooting/exhaust-ram`,
    buttonText: 'Upgrade compute',
    aiPrompt:
      'My database is experiencing high memory and swap usage. Can you query pg_stat_statements to find the top queries by shared buffer hits and rows returned, identify which queries are putting the most pressure on memory, and suggest optimizations to reduce memory consumption?',
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
    docsUrl: `${DOCS_URL}/guides/platform/going-into-prod#auth-rate-limits`,
    buttonText: 'Enable custom SMTP',
    metric: 'auth_email_rate_limit',
  },
  multiple_resource_warnings: {
    bannerContent: {
      warning: {
        title:
          'Your project is currently exhausting multiple resources, and its performance is affected',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize the most expensive queries.',
      },
      critical: {
        title: 'Your project has exhausted multiple resources, and its performance is affected',
        description:
          'Upgrade your compute or use the AI Assistant to identify and optimize the most expensive queries.',
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
    aiPrompt:
      'My database is exhausting multiple resources (CPU, memory, and/or disk IO). Can you query pg_stat_statements to identify the most expensive queries overall, and suggest which optimizations would have the biggest impact on reducing resource consumption?',
    metric: null,
  },
}
