/*
  An Edge Function to enrich data using Apollo API.

  API: https://apolloio.github.io/apollo-api-docs/?shell#people-enrichment

  curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -H "X-Api-Key: YOUR API KEY HERE" -d '{
    "id": "583f2f7ed9ced98ab5bfXXXX",
    "first_name": "Tim",
    "last_name": "Zheng",
    "organization_name": "Apollo",
    "email": "name@domain.io",
    "hashed_email": "8d935115b9ff4489f2d1f9249503cadf",
    "domain": "apollo.io",
    "linkedin_url": "http://www.linkedin.com/in/tim-zheng-677ba010",
    "reveal_personal_emails": true,
    "reveal_phone_number": true,
    "webhook_url": "https://your_webhook_site"
  }' "https://api.apollo.io/v1/people/match"
 */


console.log("Hello from Apollo Data Enrichment function!");

Deno.serve(async (req) => {
  // Get APOLLO_API_KEY environment variable.
  const apollo_api_key = Deno.env.get("APOLLO_API_KEY");

  const url = "https://api.apollo.io/v1/people/match";
  const { first_name, last_name, email } = await req.json();
  const send_data = { first_name, last_name, email };

  // Call Apollo API
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apollo_api_key,
    },
    body: JSON.stringify(send_data),
  });

  // Get response body
  const response_body = await response.json();

  return new Response(
    JSON.stringify(response_body), {
    headers: {
      "Content-Type": "application/json",
    }
  },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/apollo-data-enrichment' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{ "first_name":"Tim", "last_name":"Zheng" , "email":"tim@apollo.io"}'

*/

/* Example response:
[Info] {
  person: {
    id: "652fc57e2802bf00010c52f8",
    first_name: "Tim",
    last_name: "Z",
    name: "Tim Z",
    linkedin_url: null,
    title: "Founder & CEO",
    email_status: null,
    photo_url: "https://static.licdn.com/aero-v1/sc/h/9c8pery4andzj6ohjkjp54ma2",
    twitter_url: null,
    github_url: null,
    facebook_url: null,
    extrapolated_email_confidence: null,
    headline: "Founder & CEO at Apollo",
    email: "tim@apollo.io",
    organization_id: "5e66b6381e05b4008c8331b8",
    employment_history: [
      {
        _id: "665fb65081e1860001245111",
        created_at: null,
        current: true,
        degree: null,
        description: null,
        emails: null,
        end_date: null,
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "5e66b6381e05b4008c8331b8",
        organization_name: "Apollo",
        raw_address: null,
        start_date: "2016-01-01",
        title: "Founder & CEO",
        updated_at: null,
        id: "665fb65081e1860001245111",
        key: "665fb65081e1860001245111"
      },
      {
        _id: "665fb65081e1860001245112",
        created_at: null,
        current: false,
        degree: null,
        description: null,
        emails: null,
        end_date: "2015-01-01",
        grade_level: null,
        kind: null,
        major: null,
        organization_id: null,
        organization_name: "Braingenie",
        raw_address: null,
        start_date: "2011-01-01",
        title: "Founder & CEO",
        updated_at: null,
        id: "665fb65081e1860001245112",
        key: "665fb65081e1860001245112"
      },
      {
        _id: "665fb65081e1860001245113",
        created_at: null,
        current: false,
        degree: null,
        description: null,
        emails: null,
        end_date: "2011-01-01",
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "54a22f23746869331840e813",
        organization_name: "Citadel Investment Group",
        raw_address: null,
        start_date: "2011-01-01",
        title: "Investment & Trading Associate",
        updated_at: null,
        id: "665fb65081e1860001245113",
        key: "665fb65081e1860001245113"
      },
      {
        _id: "665fb65081e1860001245114",
        created_at: null,
        current: false,
        degree: null,
        description: null,
        emails: null,
        end_date: "2010-09-01",
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "54a1216169702d7fe6dfca02",
        organization_name: "The Boston Consulting Group",
        raw_address: null,
        start_date: "2010-08-01",
        title: "Summer Associate",
        updated_at: null,
        id: "665fb65081e1860001245114",
        key: "665fb65081e1860001245114"
      },
      {
        _id: "665fb65081e1860001245115",
        created_at: null,
        current: false,
        degree: null,
        description: null,
        emails: null,
        end_date: "2010-08-01",
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "5da2e6a3f978a8000177e831",
        organization_name: "Goldman Sachs",
        raw_address: null,
        start_date: "2010-06-01",
        title: "Summer Analyst",
        updated_at: null,
        id: "665fb65081e1860001245115",
        key: "665fb65081e1860001245115"
      },
      {
        _id: "665fb65081e1860001245116",
        created_at: null,
        current: false,
        degree: null,
        description: null,
        emails: null,
        end_date: "2010-02-01",
        grade_level: null,
        kind: null,
        major: null,
        organization_id: "54a1a06274686945fa1ffc02",
        organization_name: "Jane Street",
        raw_address: null,
        start_date: "2009-12-01",
        title: "Trading Intern",
        updated_at: null,
        id: "665fb65081e1860001245116",
        key: "665fb65081e1860001245116"
      }
    ],
    state: "California",
    city: "San Francisco",
    country: "United States",
    contact_id: "66601445de2f85038f6e4a46",
    contact: {
      contact_roles: [],
      id: "66601445de2f85038f6e4a46",
      first_name: "Tim",
      last_name: "Z",
      name: "Tim Z",
      linkedin_url: null,
      title: "Founder & CEO",
      contact_stage_id: "665fbc9257a3ca066b69272d",
      owner_id: "665fbc9457a3ca066b692899",
      creator_id: "665fbc9457a3ca066b692899",
      person_id: "652fc57e2802bf00010c52f8",
      email_needs_tickling: false,
      organization_name: "Apollo.io",
      source: "search",
      original_source: "search",
      organization_id: "5e66b6381e05b4008c8331b8",
      headline: "Founder & CEO at Apollo",
      photo_url: null,
      present_raw_address: "San Francisco, California, United States",
      linkedin_uid: null,
      extrapolated_email_confidence: null,
      salesforce_id: null,
      salesforce_lead_id: null,
      salesforce_contact_id: null,
      salesforce_account_id: null,
      crm_owner_id: null,
      created_at: "2024-06-05T07:31:17.761Z",
      emailer_campaign_ids: [],
      direct_dial_status: null,
      direct_dial_enrichment_failed_at: null,
      email_status: "verified",
      email_source: "gmail_directory",
      account_id: "66601445de2f85038f6e4a48",
      last_activity_date: null,
      hubspot_vid: null,
      hubspot_company_id: null,
      crm_id: null,
      sanitized_phone: "+14156409303",
      merged_crm_ids: null,
      updated_at: "2024-06-05T07:31:18.029Z",
      queued_for_crm_push: null,
      suggested_from_rule_engine_config_id: null,
      email_unsubscribed: null,
      label_ids: [],
      has_pending_email_arcgate_request: false,
      has_email_arcgate_request: false,
      existence_level: "full",
      email: "tim@apollo.io",
      email_from_customer: null,
      typed_custom_fields: {},
      crm_record_url: null,
      email_status_unavailable_reason: null,
      email_true_status: "Verified",
      updated_email_true_status: false,
      contact_rule_config_statuses: [],
      source_display_name: "Requested from Apollo",
      contact_emails: [],
      time_zone: "America/Los_Angeles",
      phone_numbers: [
        {
          raw_number: "+1 415-640-9303",
          sanitized_number: "+14156409303",
          type: "work_hq",
          position: 0,
          status: "no_status",
          dnc_status: null,
          dnc_other_info: null,
          dialer_flags: [Object]
        }
      ],
      account_phone_note: null,
      free_domain: false,
      is_likely_to_engage: true,
      twitter_url: null,
      restricted: true
    },
    revealed_for_current_team: true,
    restricted: true,
    organization: {
      id: "5e66b6381e05b4008c8331b8",
      name: "Apollo.io",
      website_url: "http://www.apollo.io",
      blog_url: null,
      angellist_url: null,
      linkedin_url: "http://www.linkedin.com/company/apolloio",
      twitter_url: "https://twitter.com/meetapollo/",
      facebook_url: "https://www.facebook.com/MeetApollo",
      primary_phone: {
        number: "+1 415-640-9303",
        source: "Account",
        sanitized_number: "+14156409303"
      },
      languages: [],
      alexa_ranking: 3514,
      phone: "+1 415-640-9303",
      linkedin_uid: "18511550",
      founded_year: 2015,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url: "https://zenprospect-production.s3.amazonaws.com/uploads/pictures/66505f0eecbbf2000114d1e9/picture",
      crunchbase_url: null,
      primary_domain: "apollo.io",
      sanitized_phone: "+14156409303",
      industry: "information technology & services",
      keywords: [
        "sales engagement",
        "lead generation",
        "predictive analytics",
        "lead scoring",
        "sales strategy",
        "conversation intelligence",
        "sales enablement",
        "lead routing",
        "sales development",
        "email engagement",
        "revenue intelligence",
        "sales operations",
        "sales intelligence",
        "lead intelligence",
        "prospecting",
        "b2b data"
      ],
      estimated_num_employees: 1500,
      industries: [ "information technology & services" ],
      secondary_industries: [],
      snippets_loaded: true,
      industry_tag_id: "5567cd4773696439b10b0000",
      industry_tag_hash: {
        "information technology & services": "5567cd4773696439b10b0000"
      },
      retail_location_count: 0,
      raw_address: "415 Mission St, Floor 37, San Francisco, California 94105, US",
      street_address: "415 Mission St",
      city: "San Francisco",
      state: "California",
      postal_code: "94105-2301",
      country: "United States",
      owned_by_organization_id: null,
      suborganizations: [],
      num_suborganizations: 0,
      seo_description: "Search, engage, and convert over 275 million contacts at over 73 million companies with Apollo's sal"... 40 more characters,
      short_description: "Apollo.io combines a buyer database of over 270M contacts and powerful sales engagement and automati"... 371 more characters,
      annual_revenue_printed: "100M",
      annual_revenue: 100000000,
      total_funding: 251200000,
      total_funding_printed: "251.2M",
      latest_funding_round_date: "2023-08-01T00:00:00.000+00:00",
      latest_funding_stage: "Series D",
      funding_events: [
        {
          id: "6574c1ff9b797d0001fdab1b",
          date: "2023-08-01T00:00:00.000+00:00",
          news_url: null,
          type: "Series D",
          investors: "Bain Capital Ventures, Sequoia Capital, Tribe Capital, Nexus Venture Partners",
          amount: "100M",
          currency: "$"
        },
        {
          id: "624f4dfec786590001768016",
          date: "2022-03-01T00:00:00.000+00:00",
          news_url: null,
          type: "Series C",
          investors: "Sequoia Capital, Tribe Capital, Nexus Venture Partners, NewView Capital",
          amount: "110M",
          currency: "$"
        },
        {
          id: "61b13677623110000186a478",
          date: "2021-10-01T00:00:00.000+00:00",
          news_url: null,
          type: "Series B",
          investors: "Tribe Capital, NewView Capital, Nexus Venture Partners",
          amount: "32M",
          currency: "$"
        },
        {
          id: "5ffe93caa54d75077c59acef",
          date: "2018-06-26T00:00:00.000+00:00",
          news_url: "https://techcrunch.com/2018/06/26/yc-grad-zenprospect-rebrands-as-apollo-lands-7-m-series-a/",
          type: "Series A",
          investors: "Nexus Venture Partners, Social Capital, Y Combinator",
          amount: "7M",
          currency: "$"
        },
        {
          id: "6574c1ff9b797d0001fdab20",
          date: "2016-10-01T00:00:00.000+00:00",
          news_url: null,
          type: "Other",
          investors: "Y Combinator, SV Angel, Social Capital, Nexus Venture Partners",
          amount: "2.2M",
          currency: "$"
        }
      ],
      technology_names: [
        "AI",                 "Android",
        "Basis",              "Canva",
        "Circle",             "CloudFlare Hosting",
        "Cloudflare DNS",     "Drift",
        "Gmail",              "Google Apps",
        "Google Tag Manager", "Google Workspace",
        "Gravity Forms",      "Hubspot",
        "Intercom",           "Mailchimp Mandrill",
        "Marketo",            "Microsoft Office 365",
        "Mobile Friendly",    "Python",
        "Rackspace MailGun",  "Remote",
        "Render",             "Reviews",
        "Salesforce",         "Stripe",
        "Typekit",            "WP Engine",
        "Wistia",             "WordPress.org",
        "Yandex Metrica",     "Zendesk",
        "reCAPTCHA"
      ],
      current_technologies: [
        { uid: "ai", name: "AI", category: "Other" },
        {
          uid: "android",
          name: "Android",
          category: "Frameworks and Programming Languages"
        },
        {
          uid: "basis",
          name: "Basis",
          category: "Advertising Networks"
        },
        {
          uid: "canva",
          name: "Canva",
          category: "Content Management Platform"
        },
        {
          uid: "circle",
          name: "Circle",
          category: "Financial Software"
        },
        {
          uid: "cloudflare_hosting",
          name: "CloudFlare Hosting",
          category: "Hosting"
        },
        {
          uid: "cloudflare_dns",
          name: "Cloudflare DNS",
          category: "Domain Name Services"
        },
        { uid: "drift", name: "Drift", category: "Widgets" },
        { uid: "gmail", name: "Gmail", category: "Email Providers" },
        { uid: "google_apps", name: "Google Apps", category: "Other" },
        {
          uid: "google_tag_manager",
          name: "Google Tag Manager",
          category: "Tag Management"
        },
        {
          uid: "google workspace",
          name: "Google Workspace",
          category: "Cloud Services"
        },
        {
          uid: "gravity_forms",
          name: "Gravity Forms",
          category: "Hosted Forms"
        },
        {
          uid: "hubspot",
          name: "Hubspot",
          category: "Marketing Automation"
        },
        {
          uid: "intercom",
          name: "Intercom",
          category: "Support and Feedback"
        },
        {
          uid: "mailchimp_mandrill",
          name: "Mailchimp Mandrill",
          category: "Email Delivery"
        },
        {
          uid: "marketo",
          name: "Marketo",
          category: "Marketing Automation"
        },
        {
          uid: "office_365",
          name: "Microsoft Office 365",
          category: "Other"
        },
        {
          uid: "mobile_friendly",
          name: "Mobile Friendly",
          category: "Other"
        },
        {
          uid: "python",
          name: "Python",
          category: "Frameworks and Programming Languages"
        },
        {
          uid: "rackspace_mailgun",
          name: "Rackspace MailGun",
          category: "Email Delivery"
        },
        { uid: "remote", name: "Remote", category: "Other" },
        { uid: "render", name: "Render", category: "Other" },
        {
          uid: "reviews",
          name: "Reviews",
          category: "Customer Reviews"
        },
        {
          uid: "salesforce",
          name: "Salesforce",
          category: "Customer Relationship Management"
        },
        { uid: "stripe", name: "Stripe", category: "Payments" },
        { uid: "typekit", name: "Typekit", category: "Fonts" },
        { uid: "wp_engine", name: "WP Engine", category: "CMS" },
        {
          uid: "wistia",
          name: "Wistia",
          category: "Online Video Platforms"
        },
        {
          uid: "wordpress_org",
          name: "WordPress.org",
          category: "CMS"
        },
        {
          uid: "yandex_metrika",
          name: "Yandex Metrica",
          category: "Analytics and Tracking"
        },
        {
          uid: "zendesk",
          name: "Zendesk",
          category: "Support and Feedback"
        },
        { uid: "recaptcha", name: "reCAPTCHA", category: "Captcha" }
      ],
      org_chart_root_people_ids: [ "652fc57e2802bf00010c52f8" ],
      org_chart_sector: "OrgChart::SectorHierarchy::Rules::IT",
      org_chart_removed: false,
      org_chart_show_department_filter: true
    },
    is_likely_to_engage: true,
    phone_numbers: [
      {
        raw_number: "+1 415-640-9303",
        sanitized_number: "+14156409303",
        type: "work_hq",
        position: 0,
        status: "no_status",
        dnc_status: null,
        dnc_other_info: null,
        dialer_flags: null
      }
    ],
    intent_strength: null,
    show_intent: false,
    departments: [ "c_suite" ],
    subdepartments: [ "executive", "founder" ],
    functions: [ "entrepreneurship" ],
    seniority: "founder"
  }
}
*/
