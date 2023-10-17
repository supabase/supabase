export const RESOURCE_WARNING_MESSAGES = {
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
    buttonText: 'View database settings',
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
          'Your project is about to exhaust its disk space budget, and may become unresponsive once fully exhausted',
        description:
          'You can opt to increase your disk size up to 200GB on the database settings page.',
      },
      critical: {
        title: 'Your project has exhausted its disk space budget, and may become unresponsive',
        description:
          'You can opt to increase your disk size up to 200GB on the database settings page.',
      },
    },
    cardContent: {
      warning: {
        title: 'Project is exhausting disk space budget',
        description: 'It may become unresponsive if fully exhausted',
      },
      critical: {
        title: 'Project has exhausted disk space budget',
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
}
