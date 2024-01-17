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
  www_hp_subhero_products_vector: {
    action: 'www_hp_subhero_products_vector',
    category: 'link',
    label: '',
  },
  www_pricing_hero_plan_free: {
    action: 'www_pricing_hero_plan_free',
    category: 'link',
    label: '',
  },
  www_pricing_hero_plan_pro: {
    action: 'www_pricing_hero_plan_pro',
    category: 'link',
    label: '',
  },
  www_pricing_hero_plan_team: {
    action: 'www_pricing_hero_plan_team',
    category: 'link',
    label: '',
  },
  www_pricing_hero_plan_enterprise: {
    action: 'www_pricing_hero_plan_enterprise',
    category: 'link',
    label: '',
  },
  www_pricing_comparison_free: {
    action: 'www_pricing_comparison_free',
    category: 'link',
    label: '',
  },
  www_pricing_comparison_pro: {
    action: 'www_pricing_comparison_pro',
    category: 'link',
    label: '',
  },
  www_pricing_comparison_team: {
    action: 'www_pricing_comparison_team',
    category: 'link',
    label: '',
  },
  www_pricing_comparison_enterprise: {
    action: 'www_pricing_comparison_enterprise',
    category: 'link',
    label: '',
  },
}

export default TelemetryEvents
