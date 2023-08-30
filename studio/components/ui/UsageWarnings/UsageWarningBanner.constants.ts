export const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    content: {
      warning: {
        title:
          'Your project is currently in readonly mode and is no longer accepting write requests',
        description:
          'You will need to manually override read-only mode and reduce the disk size to below 95%.',
      },
      critical: {
        title:
          'Your project is currently in readonly mode and is no longer accepting write requests',
        description:
          'You will need to manually override read-only mode and reduce the disk size to below 95%.',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode',
    buttonText: undefined,
    metric: undefined,
  },
  disk_io_exhaustion: {
    content: {
      warning: {
        title:
          'Your project is about to deplete its Disk IO Budget, and your instance may become unresponsive once fully exhausted',
        description:
          'You will need to either optimize your performance, or upgrade your compute to a larger instance.',
      },
      critical: {
        title:
          'Your project has depleted its Disk IO Budget, and your instance may become unresponsive',
        description:
          'You will need to either optimize your performance, or upgrade your compute to a larger instance.',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-disk-io',
    buttonText: 'Check usage',
    metric: 'disk_io',
  },
  disk_space_exhaustion: {
    content: {
      warning: {
        title:
          'Your project is about to exhaust its disk space budget, and your instance may become unresponsive once fully exhausted',
        description:
          'You can opt to increase your disk size up to 200GB if required on the database settings page.',
      },
      critical: {
        title:
          'Your project has exhausted its disk space budget, and your instance may become unresponsive',
        description:
          'You can opt to increase your disk size up to 200GB if required on the database settings page.',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disk-management',
    buttonText: undefined,
    metric: 'disk_space',
  },
  cpu_exhaustion: {
    content: {
      warning: {
        title:
          "Your project is currently facing high CPU usage, and your instance's performance is affected",
        description:
          'You will need to either optimize your performance or upgrade your compute to a larger instance',
      },
      critical: {
        title: "Your project's CPU usage is at 100% and your instance's performance is affected",
        description:
          'You will need to either optimize your performance or upgrade your compute to a larger instance',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-cpu',
    buttonText: 'Check usage',
    metric: 'cpu',
  },
  memory_and_swap_exhaustion: {
    content: {
      warning: {
        title:
          "Your project is currently facing high memory usage, and your instance's performance is affected",
        description:
          'You will need to either optimize your performance or upgrade your compute to a larger instance',
      },
      critical: {
        title:
          "Your project's memory usage is at 100%, and your instance's performance is affected",
        description:
          'You will need to either optimize your performance or upgrade your compute to a larger instance',
      },
    },
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-ram',
    buttonText: 'Check usage',
    metric: 'ram',
  },
  multiple_resource_warnings: {
    content: {
      warning: {
        title:
          "Your project is currently exhausting multiple resources, and your instance's performance is affected",
        description:
          "Check which resources are reaching their threshold on your project's usage page.",
      },
      critical: {
        title:
          "Your project has exhausted at least one resource, and your instance's performance is affected",
        description:
          "Check which resources have reached their threshold on your project's usage page.",
      },
    },
    docsUrl: undefined,
    buttonText: 'Check usage',
    metric: null,
  },
}
