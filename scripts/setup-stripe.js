require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function setupStripe() {
  console.log('Setting up Stripe products and prices...')

  const alaCarte1 = await stripe.products.create({ name: 'A La Carte Session - 1 Dog', description: '30 minute session for 1 dog' })
  const alaCarte1Price = await stripe.prices.create({ product: alaCarte1.id, unit_amount: 5000, currency: 'usd' })
  console.log('A La Carte 1 Dog price ID:', alaCarte1Price.id)

  const alaCarte2 = await stripe.products.create({ name: 'A La Carte Session - 2 Dogs', description: '30 minute session for 2 dogs' })
  const alaCarte2Price = await stripe.prices.create({ product: alaCarte2.id, unit_amount: 9000, currency: 'usd' })
  console.log('A La Carte 2 Dogs price ID:', alaCarte2Price.id)

  const starter1 = await stripe.products.create({ name: 'Starter Membership - 1 Dog', description: '4 sessions per month' })
  const starter1Price = await stripe.prices.create({ product: starter1.id, unit_amount: 18000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Starter 1 Dog price ID:', starter1Price.id)

  const starter2 = await stripe.products.create({ name: 'Starter Membership - 2 Dogs', description: '4 sessions per month per dog (8 total)' })
  const starter2Price = await stripe.prices.create({ product: starter2.id, unit_amount: 32400, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Starter 2 Dogs price ID:', starter2Price.id)

  const active1 = await stripe.products.create({ name: 'Active Membership - 1 Dog', description: '8 sessions per month' })
  const active1Price = await stripe.prices.create({ product: active1.id, unit_amount: 34000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Active 1 Dog price ID:', active1Price.id)

  const active2 = await stripe.products.create({ name: 'Active Membership - 2 Dogs', description: '8 sessions per month per dog (16 total)' })
  const active2Price = await stripe.prices.create({ product: active2.id, unit_amount: 61200, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Active 2 Dogs price ID:', active2Price.id)

  const athlete1 = await stripe.products.create({ name: 'Athlete Membership - 1 Dog', description: '12 sessions per month' })
  const athlete1Price = await stripe.prices.create({ product: athlete1.id, unit_amount: 48000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Athlete 1 Dog price ID:', athlete1Price.id)

  const athlete2 = await stripe.products.create({ name: 'Athlete Membership - 2 Dogs', description: '12 sessions per month per dog (24 total)' })
  const athlete2Price = await stripe.prices.create({ product: athlete2.id, unit_amount: 86400, currency: 'usd', recurring: { interval: 'month' } })
  console.log('Athlete 2 Dogs price ID:', athlete2Price.id)

  console.log('\nDone! Copy these price IDs into your .env.local')
}

setupStripe().catch(console.error)