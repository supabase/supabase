export const useProjectSubscriptionQuery = jest.fn().mockReturnValue({
  data: {
    tier: {
      supabase_prod_id: 'tier_free',
    },
  },
})
