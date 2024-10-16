/**
 * Understand Monetization
 * @module Revenue
 */

/**
 * A plan upgrade button is clicked.
 * @group Events
 * @source studio
 */

export interface plan_upgrade_cta_clicked {
  /**
   * The name of the user's current plan.
   * @optional
   */
  currentPlan?: 'free' | 'pro' | 'team' | 'enterprise'
  /**
   * The name of the add-on that the user is upgrading to.
   * @optional
   */
  addon?: 'pitr' | 'customDomain' | 'computeInstance'
}

/**
 * Event that's used to combine all revenue events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type RevenueEvents = {
  plan_upgrade_cta_clicked: plan_upgrade_cta_clicked
}
