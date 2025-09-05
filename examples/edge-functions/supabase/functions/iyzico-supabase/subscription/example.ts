// Iyzico Subscription API Example Usage
// This file shows how to use the Iyzico subscription APIs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { CreateSubscriptionRequest } from './types.ts'

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Edge function base URL
const EDGE_FUNCTION_BASE = '/functions/v1'

// 1. Create Subscription Example
export async function createSubscriptionExample() {
  try {
    // Check user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    // Prepare subscription data
    const subscriptionData: CreateSubscriptionRequest = {
      pricingPlanReferenceCode: 'PLAN_PREMIUM_MONTHLY',
      packageName: 'Premium Aylık Plan',
      customer: {
        name: 'Ahmet',
        surname: 'Yılmaz',
        email: 'ahmet@example.com',
        gsmNumber: '+905551234567',
        identityNumber: '12345678901',
        billingAddress: {
          contactName: 'Ahmet Yılmaz',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Kadıköy Mahallesi, Test Sokak No:1',
          zipCode: '34710'
        },
        shippingAddress: {
          contactName: 'Ahmet Yılmaz',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Kadıköy Mahallesi, Test Sokak No:1',
          zipCode: '34710'
        }
      }
    }

    // Send request to edge function
    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Subscription creation failed')
    }

    // Display checkout form content on the page
    const checkoutContainer = document.getElementById('checkout-form')
    if (checkoutContainer && result.data.checkoutFormContent) {
      // Use textContent instead of innerHTML to prevent XSS
      // Note: This will display the HTML as text. For proper HTML rendering,
      // consider using a sanitization library like DOMPurify in your frontend
      checkoutContainer.textContent = result.data.checkoutFormContent
    }

    console.log('Subscription created:', result.data)
    return result.data

  } catch (error) {
    console.error('Subscription creation error:', error)
    throw error
  }
}

// 2. List Subscription Products Example
export async function getSubscriptionProductsExample() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to get product list')
    }

    console.log('Subscription products:', result.data)
    return result.data

  } catch (error) {
    console.error('Error getting product list:', error)
    throw error
  }
}

// 3. Check Subscription Status Example
export async function checkSubscriptionStatusExample(referenceCode: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ referenceCode })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to get subscription status')
    }

    console.log('Subscription status:', result.data)
    return result.data

  } catch (error) {
    console.error('Error checking subscription status:', error)
    throw error
  }
}

// 4. Cancel Subscription Example
export async function cancelSubscriptionExample(referenceCode: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ referenceCode })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel subscription')
    }

    console.log('Subscription cancelled:', result.data)
    return result.data

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

// 5. Upgrade Subscription Example
export async function upgradeSubscriptionExample(
  referenceCode: string, 
  newPricingPlanReferenceCode: string
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=upgrade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        referenceCode, 
        newPricingPlanReferenceCode 
      })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to upgrade subscription')
    }

    console.log('Subscription upgraded:', result.data)
    return result.data

  } catch (error) {
    console.error('Error upgrading subscription:', error)
    throw error
  }
}

// 6. Handle Callback Example
export async function handleCallbackExample(token: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('User session not found')
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/iyzico-subscription?action=callback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to process callback')
    }

    console.log('Callback processed:', result.data)
    return result.data

  } catch (error) {
    console.error('Error processing callback:', error)
    throw error
  }
}

// React Hook Example
export function useIyzicoSubscription() {
  const createSubscription = async () => {
    return await createSubscriptionExample()
  }

  const getProducts = async () => {
    return await getSubscriptionProductsExample()
  }

  const checkStatus = async (referenceCode: string) => {
    return await checkSubscriptionStatusExample(referenceCode)
  }

  const cancelSubscription = async (referenceCode: string) => {
    return await cancelSubscriptionExample(referenceCode)
  }

  const upgradeSubscription = async (referenceCode: string, newPlan: string) => {
    return await upgradeSubscriptionExample(referenceCode, newPlan)
  }

  const handleCallback = async (token: string) => {
    return await handleCallbackExample(token)
  }

  return {
    createSubscription,
    getProducts,
    checkStatus,
    cancelSubscription,
    upgradeSubscription,
    handleCallback
  }
}