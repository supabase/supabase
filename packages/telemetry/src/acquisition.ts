/**
 * Improve User Conversion and Signup Rate
 * @module Acquisition
 */

/**
 * The user clicked the "Sign in" -button.
 * @group Events
 * @sources client-side www
 */
export interface sign_in_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}
/**
 * The user clicked the "Start project" -button.
 * @group Events
 * @sources client-side www
 */
export interface start_project_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}
/**
 * The user clicked the "Request demo" -button.
 * @group Events
 * @sources client-side www
 */
export interface request_demo_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}
/**
 * The user submitted the "Request demo" form.
 * @group Events
 * @sources client-side www
 */
export type request_demo_form_submit = never
/**
 * The user clicked the "Github stars" -button.
 * @group Events
 * @sources client-side www
 */
export interface github_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}

/**
 * The user clicked a plan's CTA -button.
 * @group Events
 * @sources client-side www
 */
export interface plan_cta_clicked {
  /**
   * The placement of the button.
   */
  placement: string
  /**
   * The plan that was clicked.
   */
  plan: 'free' | 'pro' | 'team'
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
  placement: string
}
/**
 * The user clicked the "Contact enterprise sales" -button.
 * @group Events
 * @sources client-side www
 */
export interface contact_enterprise_clicked {
  /**
   * The placement of the button.
   */
  placement: string
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
}
/**
 * A project template is clicked. The project is passed as a property.
 * @group Events
 * @sources client-side www
 */
export interface project_template_clicked {
  /**
   * The project that was clicked.
   */
  project: string
}
/**
 * A customer story card is clicked. The customer is passed as a property.
 * @group Events
 * @sources client-side www
 */
export interface customer_card_clicked {
  /**
   * The customer that was clicked.
   */
  customer: string
}
/**
 * "Open a github issue" -button clicked
 * @group Events
 * @sources client-side www
 */
export interface github_issue_open_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}
/**
 * "Request a feature" -button clicked
 * @group Events
 * @sources client-side www
 */
export interface github_request_feature_clicked {
  /**
   * The placement of the button.
   */
  placement: string
}
/**
 * A open sources project is clicked. The open sources project is passed as a property.
 * @group Events
 * @sources client-side www
 */
export interface open_source_project_clicked {
  /**
   * The open source project that was clicked.
   */
  project: string
}

/**
 * Event that's used to combine all acquisition events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type AcquisitionEvents = {
  sign_in_clicked: sign_in_clicked
  start_project_clicked: start_project_clicked
  request_demo_clicked: request_demo_clicked
  request_demo_form_submit: request_demo_form_submit
  github_clicked: github_clicked
  plan_cta_clicked: plan_cta_clicked
  see_documentation_clicked: see_documentation_clicked
  contact_enterprise_clicked: contact_enterprise_clicked
  product_card_clicked: product_card_clicked
  project_template_clicked: project_template_clicked
  customer_card_clicked: customer_card_clicked
  github_issue_open_clicked: github_issue_open_clicked
  github_request_feature_clicked: github_request_feature_clicked
  open_source_project_clicked: open_source_project_clicked
}
