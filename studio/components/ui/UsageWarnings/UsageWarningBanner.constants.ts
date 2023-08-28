// [TODO] Just double check if the docs url and correction urls are all correct
// [TODO] Correction URL should depend if V2 or V1 billing
export const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    title: 'Your project is currently in readonly mode and is no longer accepting write requests',
    description:
      'You will need to manually override read-only mode and reduce the disk size to below 95%.',
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode',
    buttonText: undefined,
    metric: undefined,
  },
  is_disk_io_budget_below_threshold: {
    title:
      'Your project is about to deplete its Disk IO Budget, and your instance may become unresponsive once fully exhausted',
    description:
      'You will need to either optimize your performance, or upgrade your compute to a larger instance.',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-disk-io',
    buttonText: 'Check usage',
    metric: 'disk_io',
  },
  is_disk_space_usage_beyond_threshold: {
    title:
      'Your project is about to exhaust its disk space budget, and your instance may become unresponsive once fully exhausted',
    description: 'Some CTA description here',
    docsUrl: undefined,
    buttonText: undefined,
    metric: undefined,
  },
  is_cpu_load_beyond_threshold: {
    title:
      "Your project is currently facing high CPU usage, and your instance's performance is affected",
    description:
      'You will need to either optimize your performance or upgrade your compute to a larger instance',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-cpu',
    buttonText: 'Check usage',
    metric: 'cpu',
  },
  is_memory_and_swap_usage_beyond_threshold: {
    title:
      "Your project is currently facing high memory usage, and your instance's performance is affected",
    description:
      'You will need to either optimize your performance or upgrade your compute to a larger instance',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-ram',
    buttonText: 'Check usage',
    metric: 'ram',
  },
  multiple_resource_warnings: {
    title:
      "Your project is currently exhausting multiple resources, and your instance's performance is affected",
    description: "Check which resources are reaching their threshold on your project's usage page.",
    docsUrl: undefined,
    buttonText: 'Check usage',
    metric: null,
  },
}
