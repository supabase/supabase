import { GoogleAnalyticsEvent } from './telemetry'

interface GoogleAnalyticsEventType {
  [key: string]: GoogleAnalyticsEvent
}

const GoogleAnalyticsEvents: GoogleAnalyticsEventType = {
  www_hp_hero_startProject: {
    action: 'www_hp_hero_startProject',
    category: 'link',
    label: 'Clicks on “Start your project” button in the home page hero',
  },
  www_hp_hero_documentation: {
    action: 'www_hp_hero_documentation',
    category: 'link',
    label: 'Clicks on “Documentation” button in the home page hero',
  },
}

export default GoogleAnalyticsEvents
