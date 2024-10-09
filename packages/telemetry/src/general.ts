/**
 * Events that are standard for all sources
 * @module General
 */

/**
 * A user leaves the application.
 *
 * @group Events
 * @source client-side www, studio, docs
 */
export interface $pageleave {
  /**
   * The URL of the page.
   */
  current_url: string
  /**
   * The path of the page.
   */
  pathname: string
}

/**
 * Any page is viewed by a user.
 *
 * @group Events
 * @source client-side www, studio, docs
 */
export interface $pageview {
  /**
   * The URL of the page.
   */
  current_url: string
  /**
   * The title of the page.
   */
  page_title: string
  /**
   * The path of the page.
   */
  pathname: string
  /**
   * UTM source parameter.
   * @optional
   */
  utm_source?: string
  /**
   * UTM medium parameter.
   * @optional
   */
  utm_medium?: string
  /**
   * UTM campaign parameter.
   * @optional
   */
  utm_campaign?: string
  /**
   * UTM term parameter.
   * @optional
   */
  utm_term?: string
  /**
   * UTM content parameter.
   * @optional
   */
  utm_content?: string
  /**
   * The referrer of the page.
   * @optional
   */
  referrer?: string
}

/**
 * Event that's used to combine all general events.
 * Hidden from the docs as it's only meant to be used for type-checking.
 * @hidden
 */
export type GeneralEvents = {
  $pageleave: $pageleave
  $pageview: $pageview
}
