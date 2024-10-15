/**
 * Understand Monetization
 * @module Revenue
 */

/**
 * The subscription is upgraded or downgraded.
 * @group Events
 * @source client-side, studio
 * @notimplemented
 */

export interface subscription_updated {
  /**
   * The direction of the change.
   */
  directionOfChange: 'upgrade' | 'downgrade'
  /**
   * The name of the old plan.
   */
  oldPlanName: 'free' | 'pro' | 'team' | 'enterprise'
  /**
   * The value of the old plan. In dollars.
   */
  oldPlanValue: number
  /**
   * The billing cycle of the old plan.
   */
  oldPlanBillingCycle: 'monthly' | 'yearly'
  /**
   * The name of the new plan.
   */
  newPlanName: 'free' | 'pro' | 'team' | 'enterprise'
  /**
   * The value of the new plan. In dollars.
   */
  newPlanValue: number
  /**
   * The billing cycle of the new plan.
   */
  newPlanBillingCycle: 'monthly' | 'yearly'
}

/**
 * The upgrade view is opened.
 *
 * @group Events
 * @source client-side, studio
 * @notimplemented
 */

export interface upgrade_cta_clicked {
  /**
   * The placement of the upgrade CTA.
   */
  placement: string
  /**
   * The name of the plan.
   */
  plan: 'free' | 'pro' | 'team' | 'enterprise'
}

/**
 * Event that's used to combine all revenue events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type RevenueEvents = {
  subscription_updated: subscription_updated
  upgrade_cta_clicked: upgrade_cta_clicked
}
