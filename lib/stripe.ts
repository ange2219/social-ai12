import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM!,
    price: 29,
  },
  business: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS!,
    price: 79,
  },
}

export async function createCheckoutSession(params: {
  userId: string
  email: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: params.email,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
    subscription_data: { metadata: { userId: params.userId } },
    allow_promotion_codes: true,
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  // Chercher d'abord par userId dans les métadonnées (résistant aux changements d'email)
  const byUserId = await stripe.customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 })
  if (byUserId.data.length > 0) return byUserId.data[0].id

  // Fallback : chercher par email (comptes créés avant l'ajout du userId en metadata)
  const byEmail = await stripe.customers.list({ email, limit: 1 })
  if (byEmail.data.length > 0) return byEmail.data[0].id

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  return customer.id
}
