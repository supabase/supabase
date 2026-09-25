import 'server-only'

import type { GoFormCrmConfig } from 'marketing'

/**
 * CRM config for forms on hand-authored pages that aren't part of the /go
 * page registry. Keyed by `${slug}/${formId}` to match the shape resolved
 * from `getGoPageBySlug` for consistency. See registerFormCrm.ts.
 */
export const staticFormCrmRegistry: Record<string, GoFormCrmConfig> = {
  'partners/become-a-partner': {
    hubspot: {
      formGuid: process.env.HUBSPOT_PARTNER_INTAKE_FORM_GUID ?? '',
      fieldMap: {
        first_name: 'firstname',
        last_name: 'lastname',
        company_size: 'how_many_people_are_on_your_team_',
        partner_type: 'type_of_partners',
        // Bound to the Company object's `name`/`website` properties (not
        // Contact) in the HubSpot form — the `0-2/` prefix tells
        // HubSpotClient to submit these against objectTypeId '0-2'.
        company_name: '0-2/name',
        company_website: '0-2/website',
        solution_product_name: 'solution_you_provide',
        integration_problem_description:
          'what_problem_does_your_integration_solve_for_a_supabase_customer',
        integration_docs_link: 'link_to_documentation',
        partnerships_website: 'can_you_share_your_companys_partnerships_website',
        services_offered: 'what_services_do_you_offer',
        operating_regions: 'which_regions_do_you_operate_in',
        supabase_postgres_experience: 'do_you_have_existing_supabase_or_postgres_experience',
        client_types: 'what_type_of_clients_do_you_typically_work_with',
        startup_program_type: 'describe_your_program',
        startup_stage: 'what_stage_of_startups_do_you_typically_work_with',
        startup_capital_deployment:
          'do_you_deploy_capital_into_your_portfoliocohort_if_so_how_much',
        additional_details: 'any_other_details_youd_like_us_to_know',
      },
    },
  },
}
