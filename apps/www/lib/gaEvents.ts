import { TelemetryEvent } from './telemetry'

interface TelemetryEventType {
  [key: string]: TelemetryEvent
}

const TelemetryEvents: TelemetryEventType = {
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
  www_hp_subhero_products_database: {
    action: 'www_hp_subhero_products_database',
    category: 'link',
    label: '',
  },
  www_hp_subhero_products_auth: {
    action: 'www_hp_subhero_products_auth',
    category: 'link',
    label: '',
  },
  www_hp_subhero_products_storage: {
    action: 'www_hp_subhero_products_storage',
    category: 'link',
    label: '',
  },
  www_hp_subhero_products_edgeFunctions: {
    action: 'www_hp_subhero_products_edgeFunctions',
    category: 'link',
    label: '',
  },
  www_hp_subhero_products_realtime: {
    action: 'www_hp_subhero_products_realtime',
    category: 'link',
    label: '',
  },
}

export default TelemetryEvents
