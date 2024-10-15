import { Telemetry } from 'telemetry'

export const TELEMETRY_EVENTS: {
  [key: string]: Telemetry.EventWithProperties
} = {
  www_hp_hero_startProject: {
    action: 'start_project_clicked',
    properties: {
      location: 'hp_hero',
    },
  },
  www_hp_hero_documentation: {
    action: 'see_documentation_clicked',
    properties: {
      location: 'hp_hero',
    },
  },
  www_hp_subhero_products_database: {
    action: 'product_card_clicked',
    properties: {
      type: 'database',
      location: 'hp_subhero',
    },
  },
  www_hp_subhero_products_auth: {
    action: 'product_card_clicked',
    properties: {
      type: 'auth',
      location: 'hp_subhero',
    },
  },
  www_hp_subhero_products_storage: {
    action: 'product_card_clicked',
    properties: {
      type: 'storage',
      location: 'hp_subhero',
    },
  },
  www_hp_subhero_products_edgeFunctions: {
    action: 'product_card_clicked',
    properties: {
      type: 'functions',
      location: 'hp_subhero',
    },
  },
  www_hp_subhero_products_realtime: {
    action: 'product_card_clicked',
    properties: {
      type: 'realtime',
      location: 'hp_subhero',
    },
  },
  www_hp_subhero_products_vector: {
    action: 'product_card_clicked',
    properties: {
      type: 'vector',
      location: 'hp_subhero',
    },
  },
  www_pricing_hero_plan_free: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'free',
      location: 'pricing_hero',
    },
  },
  www_pricing_hero_plan_pro: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'pro',
      location: 'pricing_hero',
    },
  },
  www_pricing_hero_plan_team: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'team',
      location: 'pricing_hero',
    },
  },
  www_pricing_hero_plan_enterprise: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'enterprise',
      location: 'pricing_hero',
    },
  },
  www_pricing_comparison_free: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'free',
      location: 'pricing_comparison',
    },
  },
  www_pricing_comparison_pro: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'pro',
      location: 'pricing_comparison',
    },
  },
  www_pricing_comparison_team: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'team',
      location: 'pricing_comparison',
    },
  },
  www_pricing_comparison_enterprise: {
    action: 'plan_cta_clicked',
    properties: {
      plan: 'enterprise',
      location: 'pricing_comparison',
    },
  },
  www_event_main_cta: {
    action: 'event_cta_clicked',
    properties: {
      location: 'event_page',
    },
  },
}
