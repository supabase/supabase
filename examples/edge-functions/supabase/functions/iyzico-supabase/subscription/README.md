# iyzico-subscription

This edge function provides subscription management by integrating Iyzico payment system with Supabase. It's specifically designed for developers in Turkey and other regions where Iyzico is available.

## Features

- ✅ Create subscription (checkout form)
- ✅ List subscription products
- ✅ Check subscription status
- ✅ Cancel subscription
- ✅ Upgrade subscription
- ✅ Handle callbacks
- ✅ HMACSHA256 authentication
- ✅ Supabase Auth integration
- ✅ CORS support

## File Structure

```
iyzico-subscription/
├── index.ts              # Main edge function (all API endpoints)
├── types.ts              # TypeScript type definitions
├── example.ts            # Usage examples
├── check-build.ts        # Build verification script
└── README.md             # This file
```

## Setup

### 1. Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Iyzico API Credentials
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://api.iyzipay.com  # For testing: https://sandbox-api.iyzipay.com

# Supabase (automatically available)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema

Create the `subscription_requests` table in your Supabase database:

```sql
CREATE TABLE subscription_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pricing_plan_reference_code TEXT NOT NULL,
  package_name TEXT NOT NULL,
  iyzico_token TEXT,
  conversation_id TEXT,
  reference_code TEXT,
  customer_data JSONB,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) policies
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription requests" ON subscription_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription requests" ON subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription requests" ON subscription_requests
  FOR UPDATE USING (auth.uid() = user_id);
```

## API Usage

### 1. Create Subscription

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pricingPlanReferenceCode: 'PLAN_REF_CODE',
    packageName: 'Premium Plan',
    customer: {
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      gsmNumber: '+905551234567',
      identityNumber: '12345678901',
      billingAddress: {
        contactName: 'John Doe',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Test Address',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: 'John Doe',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Test Address',
        zipCode: '34000'
      }
    }
  })
})

const result = await response.json()
// Display result.data.checkoutFormContent HTML content on the page
```

### 2. List Subscription Products

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=products', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
  }
})

const result = await response.json()
console.log(result.data) // Product list
```

### 3. Check Subscription Status

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referenceCode: 'SUBSCRIPTION_REF_CODE'
  })
})

const result = await response.json()
console.log(result.data.subscriptionStatus)
```

### 4. Cancel Subscription

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=cancel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referenceCode: 'SUBSCRIPTION_REF_CODE'
  })
})

const result = await response.json()
```

### 5. Upgrade Subscription

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=upgrade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referenceCode: 'SUBSCRIPTION_REF_CODE',
    newPricingPlanReferenceCode: 'NEW_PLAN_REF_CODE'
  })
})

const result = await response.json()
```

### 6. Handle Callback

```typescript
const response = await fetch('/functions/v1/iyzico-subscription?action=callback', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'CALLBACK_TOKEN_FROM_IYZICO'
  })
})

const result = await response.json()
```

## Testing

### Build Check

Verify that the edge function builds correctly:

```bash
# Check build and imports
deno run --allow-all check-build.ts

# Type check only
deno check index.ts
```

### Local Testing

```bash
# Terminal 1: Start edge function
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local

# Terminal 2: Send test requests
curl -X GET http://localhost:54321/functions/v1/iyzico-subscription?action=products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create subscription test
curl -X POST http://localhost:54321/functions/v1/iyzico-subscription?action=create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricingPlanReferenceCode": "PLAN_PREMIUM",
    "packageName": "Premium Plan",
    "customer": {
      "name": "Test",
      "surname": "User",
      "email": "test@example.com",
      "gsmNumber": "+905551234567",
      "identityNumber": "12345678901",
      "billingAddress": {
        "contactName": "Test User",
        "city": "Istanbul",
        "country": "Turkey",
        "address": "Test Address",
        "zipCode": "34000"
      },
      "shippingAddress": {
        "contactName": "Test User",
        "city": "Istanbul",
        "country": "Turkey",
        "address": "Test Address",
        "zipCode": "34000"
      }
    }
  }'
```

### Deploy

```bash
# Deploy edge function
supabase functions deploy iyzico-subscription

# Set environment variables
supabase secrets set --env-file ./supabase/.env.local
```

## Frontend Integration

### React/Next.js Example

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const createSubscription = async (subscriptionData: any) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch('/functions/v1/iyzico-subscription?action=create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscriptionData)
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error)
  }

  return result.data
}

// Display checkout form on the page
const handleCreateSubscription = async () => {
  try {
    const result = await createSubscription({
      pricingPlanReferenceCode: 'PLAN_REF',
      packageName: 'Premium',
      customer: {
        // ... customer data
      }
    })

    // Add HTML content to the page
    document.getElementById('checkout-form').innerHTML = result.checkoutFormContent
  } catch (error) {
    console.error('Subscription creation failed:', error)
  }
}

````

## Error Handling

The edge function handles the following error conditions:

- **401**: Authentication error
- **400**: Invalid request parameters
- **405**: Unsupported HTTP method
- **500**: Iyzico API error or internal server error

## Security

- HMACSHA256 authentication for Iyzico API
- Supabase Auth integration
- Row Level Security (RLS) policies
- CORS protection
- XSS protection: Use `textContent` instead of `innerHTML` for dynamic content

## Notes

- Set `IYZICO_BASE_URL` to `https://sandbox-api.iyzipay.com` for Iyzico test environment
- Use real Iyzico API credentials in production
- Configure your callback URLs correctly in the Iyzico panel
- Ensure all customer information is sent in the correct format