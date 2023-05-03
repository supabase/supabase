import { GoogleAnalyticsEvent } from './telemetry'

interface GoogleAnalyticsEventType {
  [key: string]: GoogleAnalyticsEvent
}

const GoogleAnalyticsEvents: GoogleAnalyticsEventType = {
  www_hp_hero_startProject: {
    action: 'www_hp_hero_startProject',
    category: 'link',
    label: '',
  },
  www_hp_hero_documentation: {
    action: 'www_hp_hero_documentation',
    category: 'link',
    label: '',
  },
}

export default GoogleAnalyticsEvents
