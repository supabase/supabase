import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type UpcomingInvoiceVariables = {
  orgSlug?: string
}

export type UpcomingInvoiceResponse = {
  amount_projected: number
  amount_total: number
  currency: string
  customer_balance: number
  subscription_id: string
  billing_cycle_end: string
  billing_cycle_start: string
  lines: {
    amount: number
    amount_before_discount: number
    description: string
    proration: boolean
    period: { start: string; end: string }
    quantity?: number
    unit_price: number
    unit_price_desc: string
    usage_based: boolean
    usage_metric?: PricingMetric
    usage_original?: number
    breakdown: {
      project_ref: string
      project_name: string
      usage: number
      amount?: number
    }[]
    metadata?: {
      is_branch: boolean
      is_read_replica: boolean
    }
  }[]
}

export async function getUpcomingInvoice(
  { orgSlug }: UpcomingInvoiceVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/billing/invoices/upcoming`, {
    params: { path: { slug: orgSlug } },
    headers: {
      Version: '2',
    },
    signal,
  })

  if (error) handleError(error)

 /* return {
    subscription_id: 'YpPwfkqHHBuCMBv3',
    amount_total: 32.88,
    amount_projected: 43.26,
    billing_cycle_start: '2025-03-26T00:00:00.000Z',
    billing_cycle_end: '2025-04-26T00:00:00.000Z',
    customer_balance: 0,
    currency: 'USD',
    lines: [
      {
        amount: 25,
        description: 'Pro Plan',
        quantity: 1,
        unit_price: 25,
        usage_based: false,
        period: {
          start: '2025-04-26T00:00:00.000Z',
          end: '2025-05-26T00:00:00.000Z',
        },
        proration: false,
      },
      {
        amount: 0,
        description: 'Monthly Active Users',
        quantity: 20,
        unit_price: null,
        unit_price_desc: '100,000 included, then $0.00325 per MAU',
        usage_based: true,
        usage_original: 20,
        usage_metric: 'MONTHLY_ACTIVE_USERS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [],
      },
      {
        amount: 0,
        description: 'Realtime Peak Connections',
        quantity: 1,
        unit_price: null,
        unit_price_desc: '500 included, then $10 per 1,000 connections',
        usage_based: true,
        usage_original: 1,
        usage_metric: 'REALTIME_PEAK_CONNECTIONS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [],
      },
      {
        amount: 4.58,
        description: 'Micro Compute',
        quantity: 341,
        unit_price: null,
        unit_price_desc: '$0.01344 per hour',
        usage_based: true,
        usage_original: 341,
        usage_metric: 'COMPUTE_HOURS_XS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            amount: 4.58,
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'micro',
            project_ref: 'jglktgcabayiacneualt',
            usage: 341,
          },
        ],
        metadata: {
          is_branch: false,
          is_read_replica: false,
        },
      },
      {
        amount: 4.58,
        description: 'Micro Compute',
        quantity: 341,
        unit_price: null,
        unit_price_desc: '$0.01344 per hour',
        usage_based: true,
        usage_original: 341,
        usage_metric: 'COMPUTE_HOURS_XS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'micro',
            project_ref: 'jglktgcabayiacneualt',
            usage: 341,
          },
        ],
        metadata: {
          is_branch: true,
          is_read_replica: false,
        },
      },
      {
        amount: 4.58,
        amount_before_discount: 500,
        description: 'Micro Compute',
        quantity: 341,
        unit_price: null,
        unit_price_desc: '$0.01344 per hour',
        usage_based: true,
        usage_original: 341,
        usage_metric: 'COMPUTE_HOURS_XS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            amount: 4.58,
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'micro',
            project_ref: 'jglktgcabayiacneualt',
            usage: 341,
          },
        ],
        metadata: {
          is_branch: false,
          is_read_replica: true,
        },
      },
      {
        amount: 0,
        description: 'Storage Images Transformed',
        quantity: 10,
        unit_price: null,
        unit_price_desc: '100 included, then $5 per 1,000 images',
        usage_based: true,
        usage_original: 10,
        usage_metric: 'STORAGE_IMAGES_TRANSFORMED',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [],
      },
      {
        amount: 0,
        description: 'Storage size',
        quantity: 21.744664719,
        unit_price: null,
        unit_price_desc: '100 included, then $0.0217 per GB',
        usage_based: true,
        usage_original: 63395523.96209913,
        usage_metric: 'STORAGE_SIZE',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'jglktgcabayiacneualt',
            project_db_instance_size: 'micro',
            usage: 63395194.04373178,
          },
          {
            project_name: 'N7 (feat/question-source)',
            project_status: 'REMOVED',
            project_ref: 'oapnmxwuccoxlqwqmjhe',
            project_db_instance_size: 'micro',
            usage: 329.9183673469388,
          },
        ],
      },
      {
        amount: 0,
        description: 'Total egress',
        quantity: 0.276028415,
        unit_price: null,
        unit_price_desc: '250 included, then $0.09 per GB',
        usage_based: true,
        usage_original: 276028415,
        usage_metric: 'EGRESS',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'N7 (fix/moving-parts)',
            project_status: 'REMOVED',
            project_ref: 'aqsoaohjkkhfmotnmcyi',
            project_db_instance_size: 'micro',
            usage: 213888,
          },
          {
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'jglktgcabayiacneualt',
            project_db_instance_size: 'micro',
            usage: 274866178,
          },
          {
            project_name: 'N7 (feat/question-source)',
            project_status: 'REMOVED',
            project_ref: 'oapnmxwuccoxlqwqmjhe',
            project_db_instance_size: 'micro',
            usage: 585519,
          },
          {
            project_name: 'N7 (feat/share-links-on-fullscreen)',
            project_status: 'REMOVED',
            project_ref: 'xfsxbqdtbdhoqecdwfup',
            project_db_instance_size: 'micro',
            usage: 362830,
          },
        ],
      },
      {
        amount: 8.61,
        description: 'Branch Compute',
        quantity: 640,
        unit_price: null,
        unit_price_desc: '$0.01344 per hour',
        usage_based: true,
        usage_original: 640,
        usage_metric: 'COMPUTE_HOURS_BRANCH',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            amount: 2,
            project_name: 'N7 (fix/moving-parts)',
            project_status: 'REMOVED',
            project_db_instance_size: 'micro',
            project_ref: 'aqsoaohjkkhfmotnmcyi',
            usage: 217,
          },
          {
            amount: 3,
            project_name: 'N7 (feat/question-source)',
            project_status: 'REMOVED',
            project_db_instance_size: 'micro',
            project_ref: 'oapnmxwuccoxlqwqmjhe',
            usage: 212,
          },
          {
            amount: 4,
            project_name: 'N7 (feat/share-links-on-fullscreen)',
            project_status: 'REMOVED',
            project_db_instance_size: 'micro',
            project_ref: 'xfsxbqdtbdhoqecdwfup',
            usage: 211,
          },
        ],
        metadata: {
          is_branch: true,
          is_read_replica: false,
        },
      },
      {
        amount: 4.69,
        amount_before_discount: 50,
        description: 'Custom Domain',
        quantity: 342,
        unit_price: null,
        unit_price_desc: '$0.0137 per hour',
        usage_based: true,
        usage_original: 342,
        usage_metric: 'CUSTOM_DOMAIN',
        period: {
          start: '2025-03-26T00:00:00.000Z',
          end: '2025-04-26T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'N7',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'jglktgcabayiacneualt',
            project_db_instance_size: 'micro',
            usage: 342,
          },
        ],
      },
      {
        amount: -10,
        description: 'Compute Credits - Up to $10.00',
        quantity: null,
        unit_price: null,
        unit_price_desc: null,
        usage_based: true,
        proration: false,
        breakdown: [],
      },
    ],
  } as unknown as UpcomingInvoiceResponse*/


  return {
    "subscription_id": "HKeuEiMySsc6oL6s",
    "amount_total": 1922.23,
    "amount_projected": 2079.7,
    "billing_cycle_start": "2025-03-16T00:00:00.000Z",
    "billing_cycle_end": "2025-04-16T00:00:00.000Z",
    "customer_balance": 97643.05,
    "currency": "USD",
    "lines": [
        {
            "amount": 0,
            "description": "Enterprise Plan",
            "quantity": 1,
            "unit_price": 0,
            "usage_based": false,
            "period": {
                "start": "2025-04-16T00:00:00.000Z",
                "end": "2025-05-16T00:00:00.000Z"
            },
            "proration": false
        },
        {
            "amount": 86.77,
            "description": "Large Compute",
            "quantity": 572,
            "unit_price": null,
            "unit_price_desc": "$0.1517 per hour",
            "usage_based": true,
            "usage_original": 572,
            "usage_metric": "COMPUTE_HOURS_L",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[Infra] salt-reporting-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "large",
                    "project_ref": "bevsmjpbjiuqpxtupizi",
                    "usage": 572
                }
            ],
            "metadata": {
                "is_branch": false,
                "is_read_replica": false
            }
        },
        {
            "amount": 47.02,
            "description": "Medium Compute",
            "quantity": 572,
            "unit_price": null,
            "unit_price_desc": "$0.0822 per hour",
            "usage_based": true,
            "usage_original": 572,
            "usage_metric": "COMPUTE_HOURS_MD",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "Misc use | Production | Used for subscriptions, email lists, tickets, og images",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "medium",
                    "project_ref": "obuldanrptloktxcffvn",
                    "usage": 572
                }
            ],
            "metadata": {
                "is_branch": false,
                "is_read_replica": false
            }
        },
        {
            "amount": 235.55,
            "description": "Micro Compute",
            "quantity": 17521,
            "unit_price": null,
            "unit_price_desc": "$0.01344 per hour",
            "usage_based": true,
            "usage_original": 17521,
            "usage_metric": "COMPUTE_HOURS_XS",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "supabase-us-east1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "aukzofqpoqpwxphdrtsl",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-northeast-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "axyshdxydgawgnstztdz",
                    "usage": 572
                },
                {
                    "project_name": "shadcn registries",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "behgbqadaonmrwhhxuac",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-south-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "bwbolhdirobyiktsaheb",
                    "usage": 572
                },
                {
                    "project_name": "[Infra] salt-reporting-dev",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "bxxqamkymdpruypbnjxw",
                    "usage": 572
                },
                {
                    "project_name": "supabase-eu-west-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "dkddwwaymtofjpmwdefc",
                    "usage": 572
                },
                {
                    "project_name": "repro",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "dwrbllohysmgcfcvvfze",
                    "usage": 572
                },
                {
                    "project_name": "pinder-db",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "ecaymjtalfbkmvhtavzn",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_primary",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "gpnjewleyxgiunjjhlkj",
                    "usage": 572
                },
                {
                    "project_name": "[Infra] Database upgrade logs",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "ihmaxnjpcccasmrbkpvo",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-northeast-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "ikhxjltiieovfljjzons",
                    "usage": 572
                },
                {
                    "project_name": "ProductOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "jojxgbufnrpudxdytslo",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] UI Registry",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "kooojyxekpoqgkqekszi",
                    "usage": 190
                },
                {
                    "project_name": "supabase-com-examples",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "kqeaxfhqnjyimjdjglsq",
                    "usage": 174
                },
                {
                    "project_name": "supabase-sa-east-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "lrrepqswpsneesbnbtck",
                    "usage": 572
                },
                {
                    "project_name": "supabase-eu-west-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "lstuapbpwgnicspiurub",
                    "usage": 572
                },
                {
                    "project_name": "hackathon dev",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "mbtpzxpicjpnybuextpx",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_apse1_rr",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "mtfikueafpausomlzihd",
                    "usage": 572
                },
                {
                    "project_name": "avoma",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "olpjauqpwsegdtazpnvw",
                    "usage": 487
                },
                {
                    "project_name": "Heroku Import",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "pcitdxsvswmnbpavvwlf",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-southeast-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "pjswwqphbxfpawjuxpoo",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ca-central-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "pszamquxbmrhgzphcxti",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-southeast-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "pzjtlsrwamgtmaopnowg",
                    "usage": 572
                },
                {
                    "project_name": "[SECURITY] - Access Requests",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "rnnlvsoafnmttekghnyg",
                    "usage": 572
                },
                {
                    "project_name": "pentest-branching-2",
                    "project_status": "REMOVED",
                    "project_db_instance_size": "micro",
                    "project_ref": "trkacqymngbwptphllce",
                    "usage": 82
                },
                {
                    "project_name": "[LIVE] supabase-run",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "wuxmobeqekfutsobqmac",
                    "usage": 572
                },
                {
                    "project_name": "Horsey - Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "xbgzwjswbqtanopifdam",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] supabase-com",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "xguihxuzqibwxjnimxev",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] dbdev-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "xmuptpplfviifrbwmmtv",
                    "usage": 572
                },
                {
                    "project_name": "supabase-eu-central-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "xpoqagpqazkhcarbtsws",
                    "usage": 572
                },
                {
                    "project_name": "track-email-abuse",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "zbqlwubsjoixvqgtwuka",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_euc1_rr",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "zdogwilkjizfunrjeprt",
                    "usage": 572
                },
                {
                    "project_name": "supabase-us-west-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "zeakbmgscwhwczrteuvc",
                    "usage": 572
                }
            ],
            "metadata": {
                "is_branch": false,
                "is_read_replica": false
            }
        },
        {
            "amount": 58.9,
            "description": "Small Compute",
            "quantity": 2860,
            "unit_price": null,
            "unit_price_desc": "$0.0206 per hour",
            "usage_based": true,
            "usage_original": 2860,
            "usage_metric": "COMPUTE_HOURS_SM",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "postgres-new",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "chwwdmiacginxmrecksk",
                    "usage": 572
                },
                {
                    "project_name": "OneToWatchThemAll 💍 - (Watcher Slackbot 👀)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "emqjythzswvoupsdufjz",
                    "usage": 572
                },
                {
                    "project_name": "[Live] Logflare Stripe Sync Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "gjbldumrynfzmuxizbdi",
                    "usage": 572
                },
                {
                    "project_name": "RevOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "pfhoujxthutxvtywpfvb",
                    "usage": 572
                },
                {
                    "project_name": "DELETE ME - TESTING PROJECT FORM",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "qfbnspyzufsevvfetmjv",
                    "usage": 572
                }
            ],
            "metadata": {
                "is_branch": false,
                "is_read_replica": false
            }
        },
        {
            "amount": 39.59,
            "description": "Branch Compute",
            "quantity": 2945,
            "unit_price": null,
            "unit_price_desc": "$0.01344 per hour",
            "usage_based": true,
            "usage_original": 2945,
            "usage_metric": "COMPUTE_HOURS_BRANCH",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[LIVE] supabase-com (feat/lw14-ticket)",
                    "project_status": "REMOVED",
                    "project_db_instance_size": "micro",
                    "project_ref": "iveilwirkfqqnzqystjh",
                    "usage": 3
                },
                {
                    "project_name": "hackathon dev (feat/seed)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "kspxehczvmrowjhvcurk",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] supabase-com (feat/local-docs-search)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "mwesmwyhgxphmqhdspsb",
                    "usage": 572
                },
                {
                    "project_name": "repro (test/migration)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "rpwjwaohdwjucofzhreo",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] supabase-com (charis/anon-read-troubleshooting)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "micro",
                    "project_ref": "temwvyeasnsofxccmaxz",
                    "usage": 572
                },
                {
                    "project_name": "hackathon dev (feat/copy)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "nano",
                    "project_ref": "utvflmpzcbzwmvsvonnp",
                    "usage": 572
                },
                {
                    "project_name": "pentest-branching-2 (branch1)",
                    "project_status": "REMOVED",
                    "project_db_instance_size": "nano",
                    "project_ref": "xcgflzfsozeygssrxtkk",
                    "usage": 82
                }
            ],
            "metadata": {
                "is_branch": true,
                "is_read_replica": false
            }
        },
        {
            "amount": 58.83,
            "description": "Disk Size IO2 GB-Hrs",
            "quantity": 220350,
            "unit_price": null,
            "unit_price_desc": "$0.000267 per unit",
            "usage_based": true,
            "usage_original": 220350,
            "usage_metric": "DISK_SIZE_GB_HOURS_IO2",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[Infra] salt-reporting-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "large",
                    "project_ref": "bevsmjpbjiuqpxtupizi",
                    "usage": 220350
                }
            ]
        },
        {
            "amount": 0,
            "description": "7-days PITR",
            "quantity": 572,
            "unit_price": null,
            "unit_price_desc": "$0.137 per hour",
            "usage_based": true,
            "usage_original": 572,
            "usage_metric": "PITR_7",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[Live] Logflare Stripe Sync Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "gjbldumrynfzmuxizbdi",
                    "usage": 572
                }
            ]
        },
        {
            "amount": 0,
            "description": "14-days PITR",
            "quantity": 572,
            "unit_price": null,
            "unit_price_desc": "$0.274 per hour",
            "usage_based": true,
            "usage_original": 572,
            "usage_metric": "PITR_14",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "RevOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "small",
                    "project_ref": "pfhoujxthutxvtywpfvb",
                    "usage": 572
                }
            ]
        },
        {
            "amount": 0,
            "description": "Storage size",
            "quantity": 19254.984911036,
            "unit_price": null,
            "unit_price_desc": "100 included, then $0.0217 per GB",
            "usage_based": true,
            "usage_original": 33027418372.27444,
            "usage_metric": "STORAGE_SIZE",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "supabase-ap-northeast-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "axyshdxydgawgnstztdz",
                    "project_db_instance_size": "micro",
                    "usage": 19882.64150943396
                },
                {
                    "project_name": "postgres-new",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "chwwdmiacginxmrecksk",
                    "project_db_instance_size": "small",
                    "usage": 3459.4716981132074
                },
                {
                    "project_name": "OneToWatchThemAll 💍 - (Watcher Slackbot 👀)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "emqjythzswvoupsdufjz",
                    "project_db_instance_size": "small",
                    "usage": 947011.2452830189
                },
                {
                    "project_name": "[LIVE] supabase-com (feat/lw14-ticket)",
                    "project_status": "REMOVED",
                    "project_ref": "iveilwirkfqqnzqystjh",
                    "project_db_instance_size": "micro",
                    "usage": 889.1526586620927
                },
                {
                    "project_name": "ProductOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "jojxgbufnrpudxdytslo",
                    "project_db_instance_size": "micro",
                    "usage": 3492436.7547169817
                },
                {
                    "project_name": "hackathon dev",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "mbtpzxpicjpnybuextpx",
                    "project_db_instance_size": "micro",
                    "usage": 64386581.50943396
                },
                {
                    "project_name": "Misc use | Production | Used for subscriptions, email lists, tickets, og images",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "obuldanrptloktxcffvn",
                    "project_db_instance_size": "medium",
                    "usage": 31963395105.622643
                },
                {
                    "project_name": "[LIVE] supabase-com (charis/anon-read-troubleshooting)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "temwvyeasnsofxccmaxz",
                    "project_db_instance_size": "micro",
                    "usage": 254297.6603773585
                },
                {
                    "project_name": "Horsey - Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xbgzwjswbqtanopifdam",
                    "project_db_instance_size": "micro",
                    "usage": 36681.58490566038
                },
                {
                    "project_name": "[LIVE] supabase-com",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xguihxuzqibwxjnimxev",
                    "project_db_instance_size": "micro",
                    "usage": 960957387.7650086
                },
                {
                    "project_name": "[LIVE] dbdev-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xmuptpplfviifrbwmmtv",
                    "project_db_instance_size": "micro",
                    "usage": 33924638.86620926
                }
            ]
        },
        {
            "amount": 755,
            "description": "Realtime Message Count",
            "quantity": 306674744,
            "unit_price": null,
            "unit_price_desc": "5 Million included, then $2.5 per Million messages",
            "usage_based": true,
            "usage_original": 306674744,
            "usage_metric": "REALTIME_MESSAGE_COUNT",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": []
        },
        {
            "amount": 40.9,
            "description": "IPv4",
            "quantity": 7436,
            "unit_price": null,
            "unit_price_desc": "$0.0055 per hour",
            "usage_based": true,
            "usage_original": 7436,
            "usage_metric": "IPV4",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "supabase-us-east1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "aukzofqpoqpwxphdrtsl",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "[Infra] salt-reporting-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "bevsmjpbjiuqpxtupizi",
                    "project_db_instance_size": "large",
                    "usage": 572
                },
                {
                    "project_name": "OneToWatchThemAll 💍 - (Watcher Slackbot 👀)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "emqjythzswvoupsdufjz",
                    "project_db_instance_size": "small",
                    "usage": 572
                },
                {
                    "project_name": "[Live] Logflare Stripe Sync Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "gjbldumrynfzmuxizbdi",
                    "project_db_instance_size": "small",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_primary",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "gpnjewleyxgiunjjhlkj",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_apse1_rr",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "mtfikueafpausomlzihd",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "Misc use | Production | Used for subscriptions, email lists, tickets, og images",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "obuldanrptloktxcffvn",
                    "project_db_instance_size": "medium",
                    "usage": 572
                },
                {
                    "project_name": "RevOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pfhoujxthutxvtywpfvb",
                    "project_db_instance_size": "small",
                    "usage": 572
                },
                {
                    "project_name": "supabase-ap-southeast-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pzjtlsrwamgtmaopnowg",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] supabase-com",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xguihxuzqibwxjnimxev",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] dbdev-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xmuptpplfviifrbwmmtv",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "supabase-eu-central-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xpoqagpqazkhcarbtsws",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "vercel_edge_euc1_rr",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "zdogwilkjizfunrjeprt",
                    "project_db_instance_size": "micro",
                    "usage": 572
                }
            ]
        },
        {
            "amount": 12,
            "description": "Function Invocations",
            "quantity": 7412581,
            "unit_price": null,
            "unit_price_desc": "2 Million included, then $2 per Million invocations",
            "usage_based": true,
            "usage_original": 7412581,
            "usage_metric": "FUNCTION_INVOCATIONS",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": []
        },
        {
            "amount": 0,
            "description": "Monthly Active Users",
            "quantity": 8910,
            "unit_price": null,
            "unit_price_desc": "100,000 included, then $0.00325 per MAU",
            "usage_based": true,
            "usage_original": 8910,
            "usage_metric": "MONTHLY_ACTIVE_USERS",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": []
        },
        {
            "amount": 47.02,
            "description": "Custom Domain",
            "quantity": 3432,
            "unit_price": null,
            "unit_price_desc": "$0.0137 per hour",
            "usage_based": true,
            "usage_original": 3432,
            "usage_metric": "CUSTOM_DOMAIN",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "OneToWatchThemAll 💍 - (Watcher Slackbot 👀)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "emqjythzswvoupsdufjz",
                    "project_db_instance_size": "small",
                    "usage": 572
                },
                {
                    "project_name": "ProductOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "jojxgbufnrpudxdytslo",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "Misc use | Production | Used for subscriptions, email lists, tickets, og images",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "obuldanrptloktxcffvn",
                    "project_db_instance_size": "medium",
                    "usage": 572
                },
                {
                    "project_name": "RevOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pfhoujxthutxvtywpfvb",
                    "project_db_instance_size": "small",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] supabase-run",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "wuxmobeqekfutsobqmac",
                    "project_db_instance_size": "micro",
                    "usage": 572
                },
                {
                    "project_name": "[LIVE] dbdev-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xmuptpplfviifrbwmmtv",
                    "project_db_instance_size": "micro",
                    "usage": 572
                }
            ]
        },
        {
            "amount": 466.18,
            "description": "Disk IOPS IO2",
            "quantity": 2860000,
            "unit_price": null,
            "unit_price_desc": "$0.000163 per hour",
            "usage_based": true,
            "usage_original": 2860000,
            "usage_metric": "DISK_IOPS_IO2",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[Infra] salt-reporting-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "large",
                    "project_ref": "bevsmjpbjiuqpxtupizi",
                    "usage": 2860000
                }
            ]
        },
        {
            "amount": 74.47,
            "description": "Total egress",
            "quantity": 1077.421589453,
            "unit_price": null,
            "unit_price_desc": "250 included, then $0.09 per GB",
            "usage_based": true,
            "usage_original": 1077421589453,
            "usage_metric": "EGRESS",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "supabase-us-east1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "aukzofqpoqpwxphdrtsl",
                    "project_db_instance_size": "micro",
                    "usage": 249043485
                },
                {
                    "project_name": "supabase-ap-northeast-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "axyshdxydgawgnstztdz",
                    "project_db_instance_size": "micro",
                    "usage": 626194990
                },
                {
                    "project_name": "supabase-ap-south-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "bwbolhdirobyiktsaheb",
                    "project_db_instance_size": "micro",
                    "usage": 755745200
                },
                {
                    "project_name": "[Infra] salt-reporting-dev",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "bxxqamkymdpruypbnjxw",
                    "project_db_instance_size": "micro",
                    "usage": 104365841
                },
                {
                    "project_name": "postgres-new",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "chwwdmiacginxmrecksk",
                    "project_db_instance_size": "small",
                    "usage": 688091498
                },
                {
                    "project_name": "supabase-eu-west-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "dkddwwaymtofjpmwdefc",
                    "project_db_instance_size": "micro",
                    "usage": 820824688
                },
                {
                    "project_name": "OneToWatchThemAll 💍 - (Watcher Slackbot 👀)",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "emqjythzswvoupsdufjz",
                    "project_db_instance_size": "small",
                    "usage": 31428161847
                },
                {
                    "project_name": "[Live] Logflare Stripe Sync Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "gjbldumrynfzmuxizbdi",
                    "project_db_instance_size": "small",
                    "usage": 88
                },
                {
                    "project_name": "vercel_edge_primary",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "gpnjewleyxgiunjjhlkj",
                    "project_db_instance_size": "micro",
                    "usage": 1526429
                },
                {
                    "project_name": "[Infra] Database upgrade logs",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "ihmaxnjpcccasmrbkpvo",
                    "project_db_instance_size": "micro",
                    "usage": 1459691
                },
                {
                    "project_name": "supabase-ap-northeast-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "ikhxjltiieovfljjzons",
                    "project_db_instance_size": "micro",
                    "usage": 564737852
                },
                {
                    "project_name": "[LIVE] supabase-com (feat/lw14-ticket)",
                    "project_status": "REMOVED",
                    "project_ref": "iveilwirkfqqnzqystjh",
                    "project_db_instance_size": "micro",
                    "usage": 3921.0000000000005
                },
                {
                    "project_name": "ProductOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "jojxgbufnrpudxdytslo",
                    "project_db_instance_size": "micro",
                    "usage": 27015669
                },
                {
                    "project_name": "[LIVE] UI Registry",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "kooojyxekpoqgkqekszi",
                    "project_db_instance_size": "nano",
                    "usage": 131005913822
                },
                {
                    "project_name": "supabase-com-examples",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "kqeaxfhqnjyimjdjglsq",
                    "project_db_instance_size": "micro",
                    "usage": 748602460
                },
                {
                    "project_name": "supabase-sa-east-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "lrrepqswpsneesbnbtck",
                    "project_db_instance_size": "micro",
                    "usage": 878384810
                },
                {
                    "project_name": "supabase-eu-west-2",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "lstuapbpwgnicspiurub",
                    "project_db_instance_size": "micro",
                    "usage": 1019803403.9999999
                },
                {
                    "project_name": "hackathon dev",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "mbtpzxpicjpnybuextpx",
                    "project_db_instance_size": "micro",
                    "usage": 302919360
                },
                {
                    "project_name": "Misc use | Production | Used for subscriptions, email lists, tickets, og images",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "obuldanrptloktxcffvn",
                    "project_db_instance_size": "medium",
                    "usage": 304066954354
                },
                {
                    "project_name": "avoma",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "olpjauqpwsegdtazpnvw",
                    "project_db_instance_size": "micro",
                    "usage": 79184211
                },
                {
                    "project_name": "Heroku Import",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pcitdxsvswmnbpavvwlf",
                    "project_db_instance_size": "micro",
                    "usage": 6862256
                },
                {
                    "project_name": "RevOps",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pfhoujxthutxvtywpfvb",
                    "project_db_instance_size": "small",
                    "usage": 206057708
                },
                {
                    "project_name": "supabase-ca-central-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pszamquxbmrhgzphcxti",
                    "project_db_instance_size": "micro",
                    "usage": 765977058
                },
                {
                    "project_name": "supabase-ap-southeast-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "pzjtlsrwamgtmaopnowg",
                    "project_db_instance_size": "micro",
                    "usage": 247425053
                },
                {
                    "project_name": "[SECURITY] - Access Requests",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "rnnlvsoafnmttekghnyg",
                    "project_db_instance_size": "micro",
                    "usage": 617174
                },
                {
                    "project_name": "Horsey - Prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xbgzwjswbqtanopifdam",
                    "project_db_instance_size": "micro",
                    "usage": 3521637455
                },
                {
                    "project_name": "[LIVE] supabase-com",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xguihxuzqibwxjnimxev",
                    "project_db_instance_size": "micro",
                    "usage": 597764145748
                },
                {
                    "project_name": "[LIVE] dbdev-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xmuptpplfviifrbwmmtv",
                    "project_db_instance_size": "micro",
                    "usage": 450880164
                },
                {
                    "project_name": "supabase-eu-central-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "xpoqagpqazkhcarbtsws",
                    "project_db_instance_size": "micro",
                    "usage": 249105670
                },
                {
                    "project_name": "track-email-abuse",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "zbqlwubsjoixvqgtwuka",
                    "project_db_instance_size": "micro",
                    "usage": 4665183
                },
                {
                    "project_name": "supabase-us-west-1",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_ref": "zeakbmgscwhwczrteuvc",
                    "project_db_instance_size": "micro",
                    "usage": 835282364
                }
            ]
        },
        {
            "amount": 0,
            "description": "Disk Throughput",
            "quantity": 71500,
            "unit_price": null,
            "unit_price_desc": "$0.00013 per unit",
            "usage_based": true,
            "usage_original": 71500,
            "usage_metric": "DISK_THROUGHPUT_GP3",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": [
                {
                    "project_name": "[Infra] salt-reporting-prod",
                    "project_status": "ACTIVE_HEALTHY",
                    "project_db_instance_size": "large",
                    "project_ref": "bevsmjpbjiuqpxtupizi",
                    "usage": 71500
                }
            ]
        },
        {
            "amount": 10,
            "description": "Realtime Peak Connections",
            "quantity": 663,
            "unit_price": null,
            "unit_price_desc": "500 included, then $10 per 1,000 connections",
            "usage_based": true,
            "usage_original": 663,
            "usage_metric": "REALTIME_PEAK_CONNECTIONS",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": []
        },
        {
            "amount": 0,
            "description": "Storage Images Transformed",
            "quantity": 15,
            "unit_price": null,
            "unit_price_desc": "100 included, then $5 per 1,000 images",
            "usage_based": true,
            "usage_original": 15,
            "usage_metric": "STORAGE_IMAGES_TRANSFORMED",
            "period": {
                "start": "2025-03-16T00:00:00.000Z",
                "end": "2025-04-16T00:00:00.000Z"
            },
            "proration": false,
            "breakdown": []
        },
        {
            "amount": -10,
            "description": "Compute Credits - Up to $10.00",
            "quantity": null,
            "unit_price": null,
            "unit_price_desc": null,
            "usage_based": true,
            "proration": false,
            "breakdown": []
        }
    ]
} as unknown as UpcomingInvoiceResponse

  /*   return {
    subscription_id: 'BfE2S5qfiS2tqsRB',
    amount_total: 29.87,
    amount_projected: 69.96,
    billing_cycle_start: '2025-04-03T00:00:00.000Z',
    billing_cycle_end: '2025-05-03T00:00:00.000Z',
    customer_balance: 0,
    currency: 'USD',
    lines: [
      {
        amount: 25,
        description: 'Pro Plan',
        quantity: 1,
        unit_price: 25,
        usage_based: false,
        period: {
          start: '2025-05-03T00:00:00.000Z',
          end: '2025-06-03T00:00:00.000Z',
        },
        proration: false,
      },
      {
        amount: 0.81,
        description: 'Disk Size GP3 GB-Hrs',
        quantity: 4736,
        unit_price: null,
        unit_price_desc: '$0.000171 per unit',
        usage_based: true,
        usage_original: 4736,
        usage_metric: 'DISK_SIZE_GB_HOURS_GP3',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'Parqet PROD',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'small',
            project_ref: 'kxjrjcvxdyehwmolbjib',
            usage: 4736,
          },
        ],
      },
      {
        amount: 0,
        description: 'Total egress',
        quantity: 11.012242776,
        unit_price: null,
        unit_price_desc: '250 included, then $0.09 per GB',
        usage_based: true,
        usage_original: 11012242776,
        usage_metric: 'EGRESS',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'Parqet PROD',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'kxjrjcvxdyehwmolbjib',
            project_db_instance_size: 'small',
            usage: 10994029068,
          },
          {
            project_name: 'Parqet Admin',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'locslkgledvvjopfghbb',
            project_db_instance_size: 'micro',
            usage: 2227867,
          },
          {
            project_name: 'Parqet DEV',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'urcfcxoergslefbnvbui',
            project_db_instance_size: 'micro',
            usage: 15985841,
          },
        ],
      },
      {
        amount: 4.06,
        description: 'Custom Domain',
        quantity: 296,
        unit_price: null,
        unit_price_desc: '$0.0137 per hour',
        usage_based: true,
        usage_original: 296,
        usage_metric: 'CUSTOM_DOMAIN',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'Parqet PROD',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'kxjrjcvxdyehwmolbjib',
            project_db_instance_size: 'small',
            usage: 148,
          },
          {
            project_name: 'Parqet DEV',
            project_status: 'ACTIVE_HEALTHY',
            project_ref: 'urcfcxoergslefbnvbui',
            project_db_instance_size: 'micro',
            usage: 148,
          },
        ],
      },
      {
        amount: 3.98,
        description: 'Micro Compute',
        quantity: 296,
        unit_price: null,
        unit_price_desc: '$0.01344 per hour',
        usage_based: true,
        usage_original: 296,
        usage_metric: 'COMPUTE_HOURS_XS',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'Parqet Admin',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'micro',
            project_ref: 'locslkgledvvjopfghbb',
            usage: 148,
          },
          {
            project_name: 'Parqet DEV',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'micro',
            project_ref: 'urcfcxoergslefbnvbui',
            usage: 148,
          },
        ],
        metadata: {
          is_branch: false,
          is_read_replica: false,
        },
      },
      {
        amount: 3.05,
        description: 'Small Compute',
        quantity: 148,
        unit_price: null,
        unit_price_desc: '$0.0206 per hour',
        usage_based: true,
        usage_original: 148,
        usage_metric: 'COMPUTE_HOURS_SM',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [
          {
            project_name: 'Parqet PROD',
            project_status: 'ACTIVE_HEALTHY',
            project_db_instance_size: 'small',
            project_ref: 'kxjrjcvxdyehwmolbjib',
            usage: 148,
          },
        ],
        metadata: {
          is_branch: false,
          is_read_replica: false,
        },
      },
      {
        amount: 0,
        description: 'Monthly Active Users',
        quantity: 30887,
        unit_price: null,
        unit_price_desc: '100,000 included, then $0.00325 per MAU',
        usage_based: true,
        usage_original: 30887,
        usage_metric: 'MONTHLY_ACTIVE_USERS',
        period: {
          start: '2025-04-03T00:00:00.000Z',
          end: '2025-05-03T00:00:00.000Z',
        },
        proration: false,
        breakdown: [],
      },
      {
        amount: -7.029999999999999,
        description: 'Compute Credits - Up to $10.00',
        quantity: null,
        unit_price: null,
        unit_price_desc: null,
        usage_based: true,
        proration: false,
        breakdown: [],
      },
    ],
  } as unknown as UpcomingInvoiceResponse*/
}

export type UpcomingInvoiceData = Awaited<ReturnType<typeof getUpcomingInvoice>>
export type UpcomingInvoiceError = ResponseError

export const useOrgUpcomingInvoiceQuery = <TData = UpcomingInvoiceData>(
  { orgSlug }: UpcomingInvoiceVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UpcomingInvoiceData, UpcomingInvoiceError, TData> = {}
) =>
  useQuery<UpcomingInvoiceData, UpcomingInvoiceError, TData>(
    invoicesKeys.orgUpcomingPreview(orgSlug),
    ({ signal }) => getUpcomingInvoice({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
