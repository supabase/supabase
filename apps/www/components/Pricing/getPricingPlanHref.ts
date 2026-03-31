import { PricingInformation } from 'shared-data/plans'

const FREE_PLAN_SIGN_IN_URL = 'https://supabase.com/dashboard/sign-in?returnTo=%2Fnew%3Fplan%3Dfree'

export const getPricingPlanHref = ({
  plan,
  isLoggedIn,
  isUserLoading,
}: {
  plan: PricingInformation
  isLoggedIn: boolean
  isUserLoading: boolean
}) => {
  if (plan.planId !== 'free') {
    return plan.href
  }

  if (isUserLoading) {
    return plan.href
  }

  return isLoggedIn ? plan.href : FREE_PLAN_SIGN_IN_URL
}
