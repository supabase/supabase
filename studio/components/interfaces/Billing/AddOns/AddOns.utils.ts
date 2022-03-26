export const formatComputeSizes = (computeSizes: any[]) => {
  // Just need to order the options - ideally if the API can filter this that'll be great
  // but for now just let FE order to get things moving quickly

  // FE will also inject the micro option as this will not be saved in our stripe dashboard

  const microOption = {
    id: '',
    name: 'Optimized database instance [Micro]',
    description: 'Basic set up to get started',
    metadata: {
      default_price_id: undefined,
      supabase_prod_id: 'addon_instance_micro',
      features: '2 CPUs • 1GB memory • 2,085Mbps Disk IO',
    },
    prices: [
      {
        id: undefined,
        currency: 'usd',
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
          interval_count: 1,
          aggregate_usage: null,
          trial_period_days: null,
        },
        unit_amount: 0,
      },
    ],
  }

  return [microOption]
    .concat(
      computeSizes.filter(
        (option: any) => option.metadata.supabase_prod_id === 'addon_instance_small'
      )
    )
    .concat(
      computeSizes.filter(
        (option: any) => option.metadata.supabase_prod_id === 'addon_instance_medium'
      )
    )
    .concat(
      computeSizes.filter(
        (option: any) => option.metadata.supabase_prod_id === 'addon_instance_large'
      )
    )
    .concat(
      computeSizes.filter(
        (option: any) => option.metadata.supabase_prod_id === 'addon_instance_xlarge'
      )
    )
    .concat(
      computeSizes.filter(
        (option: any) => option.metadata.supabase_prod_id === 'addon_instance_xxlarge'
      )
    )
}
