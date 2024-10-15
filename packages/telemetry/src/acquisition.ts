/**
 * Improve User Conversion and Signup Rate
 * @module Acquisition
 */

/**
 * The user clicked the "Start project" -button.
 * @group Events
 * @sources client-side www
 */
export interface start_project_clicked {
  /**
   * The placement of the button.
   */
  location: 'hp_hero' | 'hp_subhero' | 'pricing_hero' | 'pricing_comparison' | 'event_page'
}
/**
 * The user clicked the "See documentation" -button.
 * @group Events
 * @sources client-side www
 */
export interface see_documentation_clicked {
  /**
   * The placement of the button.
   */
  location: 'hp_hero' | 'hp_subhero' | 'pricing_hero' | 'pricing_comparison' | 'event_page'
}

/**
 * @description The user clicked a plan's CTA -button.
 * @group Events
 * @sources client-side www
 */
export interface plan_cta_clicked {
  /**
   * The placement of the button.
   */
  location: 'hp_hero' | 'hp_subhero' | 'pricing_hero' | 'pricing_comparison' | 'event_page'
  /**
   * The plan that was clicked.
   */
  plan: 'free' | 'pro' | 'team' | 'enterprise'
}

export interface framework_clicked {
  /**
   * The framework that was clicked.
   */
  framework:
    | 'React'
    | 'Next.js'
    | 'RedwoodJS'
    | 'Flutter'
    | 'Kotlin'
    | 'Svelte'
    | 'SolidJS'
    | 'Vue'
    | 'Nuxt'
    | 'Refine'
  /**
   * The placement of the button.
   */
  location: 'hp_subhero'
}

/**
 * A subhero product card is clicked. The type is passed as a property
 * @group Events
 * @sources client-side www
 */
export interface product_card_clicked {
  /**
   * The type of product that was clicked.
   */
  type: 'database' | 'auth' | 'storage' | 'functions' | 'realtime' | 'vector'
  /**
   * The placement of the button.
   */
  location: 'hp_subhero'
}
/**
 * The CTA-button on the event page is clicked.
 * @group Events
 * @sources client-side www
 */
export interface event_cta_clicked {
  /**
   * The placement of the button.
   */
  location: 'event_page'
}

/**
 * Event that's used to combine all acquisition events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type AcquisitionEvents = {
  start_project_clicked: start_project_clicked
  plan_cta_clicked: plan_cta_clicked
  see_documentation_clicked: see_documentation_clicked
  framework_clicked: framework_clicked
  product_card_clicked: product_card_clicked
  event_cta_clicked: event_cta_clicked
}
