import { TelemetryEvent } from './telemetry'

interface TelemetryEventType {
  [key: string]: TelemetryEvent
}

const TelemetryEvents: TelemetryEventType = {
  www_hp_hero_startProject: {
    action: 'click',
    category: 'www_hp_hero',
    label: 'start_project',
  },
  www_hp_hero_documentation: {
    action: 'click',
    category: 'www_hp_hero',
    label: 'documentation',
  },
  www_hp_subhero_products_database: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_database',
  },
  www_hp_subhero_products_auth: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_auth',
  },
  www_hp_subhero_products_storage: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_storage',
  },
  www_hp_subhero_products_edgeFunctions: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_functions',
  },
  www_hp_subhero_products_realtime: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_realtime',
  },
  www_hp_subhero_products_vector: {
    action: 'click',
    category: 'www_hp_subhero',
    label: 'products_vector',
  },
  www_pricing_hero_plan_free: {
    action: 'click',
    category: 'www_pricing_hero',
    label: 'plan_free',
  },
  www_pricing_hero_plan_pro: {
    action: 'click',
    category: 'www_pricing_hero',
    label: 'plan_pro',
  },
  www_pricing_hero_plan_team: {
    action: 'click',
    category: 'www_pricing_hero',
    label: 'plan_team',
  },
  www_pricing_hero_plan_enterprise: {
    action: 'click',
    category: 'www_pricing_hero',
    label: 'plan_enterprise',
  },
  www_pricing_comparison_free: {
    action: 'click',
    category: 'www_pricing_comparison',
    label: 'free',
  },
  www_pricing_comparison_pro: {
    action: 'click',
    category: 'www_pricing_comparison',
    label: 'pro',
  },
  www_pricing_comparison_team: {
    action: 'click',
    category: 'www_pricing_comparison',
    label: 'team',
  },
  www_pricing_comparison_enterprise: {
    action: 'click',
    category: 'www_pricing_comparison',
    label: 'enterprise',
  },
}

export default TelemetryEvents
