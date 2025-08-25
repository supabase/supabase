// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import type {
  CreateSubscriptionRequest,
  IyzicoResponse,
  IyzicoCheckoutFormResponse,
  IyzicoSubscriptionResponse
} from './types.ts'
import { corsHeaders } from '../../_shared/cors.ts';

// Crypto API for HMACSHA256 implementation
const crypto = globalThis.crypto

// Iyzico API configuration
const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || 'https://api.iyzipay.com'
const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')

// HMACSHA256 authentication function for Iyzico API
async function generateIyzicoAuth(
  apiKey: string, 
  secretKey: string, 
  randomKey: string, 
  uriPath: string, 
  requestBody: string = ''
): Promise<string> {
  const payload = randomKey + uriPath + requestBody
  
  const keyBytes = new TextEncoder().encode(secretKey)
  const dataBytes = new TextEncoder().encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
  const hashArray = new Uint8Array(hashBuffer)
  
  const signature = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase()
  
  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  const base64Auth = btoa(authString)
  
  return `IYZWSv2 ${base64Auth}`
}

// Make authenticated request to Iyzico API
async function makeIyzicoRequest(
  endpoint: string, 
  method: string, 
  body?: any
): Promise<any> {
  if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
    throw new Error('Iyzico API credentials not configured')
  }

  const randomKey = Date.now().toString() + Math.random().toString(36).substring(2, 15)
  const uriPath = endpoint.split('?')[0]
  const requestBody = body ? JSON.stringify(body) : ''
  
  const auth = await generateIyzicoAuth(IYZICO_API_KEY, IYZICO_SECRET_KEY, randomKey, uriPath, requestBody)
  
  const response = await fetch(`${IYZICO_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomKey
    },
    body: requestBody || undefined
  })

  const responseText = await response.text()
  
  if (!response.ok) {
    throw new Error(`Iyzico API error: ${response.status} - ${responseText}`)
  }

  return JSON.parse(responseText)
}

// Create subscription checkout form
async function createSubscriptionCheckout(
  user: any, 
  requestData: CreateSubscriptionRequest,
  callbackUrl: string
): Promise<IyzicoCheckoutFormResponse> {
  const iyzicoRequest = {
    locale: 'tr',
    conversationId: `subscription-${user.id}-${Date.now()}`,
    pricingPlanReferenceCode: requestData.pricingPlanReferenceCode,
    subscriptionInitialStatus: 'ACTIVE',
    callbackUrl: callbackUrl,
    customer: requestData.customer
  }

  return await makeIyzicoRequest('/v2/subscription/checkoutform/initialize', 'POST', iyzicoRequest)
}

// Get subscription products
async function getSubscriptionProducts(): Promise<any> {
  return await makeIyzicoRequest('/v2/subscription/products', 'GET')
}

// Check subscription status
async function checkSubscriptionStatus(referenceCode: string): Promise<IyzicoSubscriptionResponse> {
  return await makeIyzicoRequest(`/v2/subscription/${referenceCode}`, 'GET')
}

// Cancel subscription
async function cancelSubscription(referenceCode: string): Promise<IyzicoResponse> {
  return await makeIyzicoRequest(`/v2/subscription/${referenceCode}/cancel`, 'POST')
}

// Upgrade subscription
async function upgradeSubscription(
  referenceCode: string, 
  newPricingPlanReferenceCode: string
): Promise<IyzicoResponse> {
  const upgradeRequest = {
    locale: 'tr',
    conversationId: `upgrade-${referenceCode}-${Date.now()}`,
    newPricingPlanReferenceCode: newPricingPlanReferenceCode
  }

  return await makeIyzicoRequest(`/v2/subscription/${referenceCode}/upgrade`, 'POST', upgradeRequest)
}

// Handle subscription callback
async function handleSubscriptionCallback(token: string): Promise<IyzicoSubscriptionResponse> {
  const callbackRequest = {
    locale: 'tr',
    conversationId: `callback-${Date.now()}`,
    token: token
  }

  return await makeIyzicoRequest('/v2/subscription/checkoutform/auth/ecom', 'POST', callbackRequest)
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const requestData = req.method === 'POST' ? await req.json() : {}

    // Route to appropriate action
    switch (action) {
      case 'create': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for create action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const callbackUrl = `${url.origin}/subscription-callback`
        const checkoutResponse = await createSubscriptionCheckout(user, requestData, callbackUrl)
        
        if (checkoutResponse.status !== 'success') {
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create subscription checkout',
              errorCode: checkoutResponse.errorCode,
              errorMessage: checkoutResponse.errorMessage
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Save subscription request to database
        await supabase
          .from('subscription_requests')
          .insert({
            user_id: user.id,
            pricing_plan_reference_code: requestData.pricingPlanReferenceCode,
            package_name: requestData.packageName,
            iyzico_token: checkoutResponse.token,
            conversation_id: `subscription-${user.id}-${Date.now()}`,
            customer_data: requestData.customer,
            status: 'PENDING',
            created_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              checkoutFormContent: checkoutResponse.checkoutFormContent,
              token: checkoutResponse.token,
              tokenExpireTime: checkoutResponse.tokenExpireTime,
              callbackUrl: callbackUrl
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'products': {
        if (req.method !== 'GET') {
          return new Response(
            JSON.stringify({ error: 'GET method required for products action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const productsResponse = await getSubscriptionProducts()
        return new Response(
          JSON.stringify({ success: true, data: productsResponse }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'status': {
        if (req.method !== 'GET') {
          return new Response(
            JSON.stringify({ error: 'GET method required for status action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { referenceCode } = requestData
        if (!referenceCode) {
          return new Response(
            JSON.stringify({ error: 'Reference code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const statusResponse = await checkSubscriptionStatus(referenceCode)
        return new Response(
          JSON.stringify({ success: true, data: statusResponse }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'cancel': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for cancel action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { referenceCode: cancelReferenceCode } = requestData
        if (!cancelReferenceCode) {
          return new Response(
            JSON.stringify({ error: 'Reference code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const cancelResponse = await cancelSubscription(cancelReferenceCode)
        return new Response(
          JSON.stringify({ success: true, data: cancelResponse }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'upgrade': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for upgrade action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { referenceCode: upgradeReferenceCode, newPricingPlanReferenceCode } = requestData
        if (!upgradeReferenceCode || !newPricingPlanReferenceCode) {
          return new Response(
            JSON.stringify({ error: 'Reference code and new pricing plan required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const upgradeResponse = await upgradeSubscription(upgradeReferenceCode, newPricingPlanReferenceCode)
        return new Response(
          JSON.stringify({ success: true, data: upgradeResponse }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'callback': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for callback action' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { token } = requestData
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const callbackResponse = await handleSubscriptionCallback(token)
        
        if (callbackResponse.status === 'success' && callbackResponse.referenceCode) {
          // Update subscription request status
          await supabase
            .from('subscription_requests')
            .update({ 
              status: 'ACTIVE',
              reference_code: callbackResponse.referenceCode,
              updated_at: new Date().toISOString()
            })
            .eq('iyzico_token', token)
        }

        return new Response(
          JSON.stringify({ success: true, data: callbackResponse }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action. Supported actions: create, products, status, cancel, upgrade, callback' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 