require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function setupStripe() {
  console.log('Setting up Stripe products and prices...')

  // A La Carte
  const alaCarte1 = await stripe.products.create({ name: 'A La Carte Session - 1 Dog', description: '30 minute session for 1 dog' })
  const alaCarte1Price = await stripe.prices.create({ product: alaCarte1.id, unit_amount: 5500, currency: 'usd' })
  console.log('STRIPE_PRICE_ALACARTE_1DOG=' + alaCarte1Price.id)

  const alaCarte2 = await stripe.products.create({ name: 'A La Carte Session - 2 Dogs', description: '30 minute session for 2 dogs' })
  const alaCarte2Price = await stripe.prices.create({ product: alaCarte2.id, unit_amount: 11000, currency: 'usd' })
  console.log('STRIPE_PRICE_ALACARTE_2DOGS=' + alaCarte2Price.id)

  // Intro Package
  const intro = await stripe.products.create({ name: 'Intro Package', description: '2 introductory sessions for first-time dogs' })
  const introPrice = await stripe.prices.create({ product: intro.id, unit_amount: 8500, currency: 'usd' })
  console.log('STRIPE_PRICE_INTRO=' + introPrice.id)

  // Standard (starter)
  const starter1 = await stripe.products.create({ name: 'Standard Membership', description: '4 sessions per month' })
  const starter1Price = await stripe.prices.create({ product: starter1.id, unit_amount: 18000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_STARTER_1DOG=' + starter1Price.id)

  const starterAddon = await stripe.products.create({ name: 'Standard Membership - Add-on Dog', description: '4 sessions per month for second dog' })
  const starterAddonPrice = await stripe.prices.create({ product: starterAddon.id, unit_amount: 16200, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_STARTER_ADDON=' + starterAddonPrice.id)

  // Pro (active)
  const active1 = await stripe.products.create({ name: 'Pro Membership', description: '8 sessions per month' })
  const active1Price = await stripe.prices.create({ product: active1.id, unit_amount: 34000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_ACTIVE_1DOG=' + active1Price.id)

  const activeAddon = await stripe.products.create({ name: 'Pro Membership - Add-on Dog', description: '8 sessions per month for second dog' })
  const activeAddonPrice = await stripe.prices.create({ product: activeAddon.id, unit_amount: 30600, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_ACTIVE_ADDON=' + activeAddonPrice.id)

  // Elite (athlete)
  const athlete1 = await stripe.products.create({ name: 'Elite Membership', description: '12 sessions per month' })
  const athlete1Price = await stripe.prices.create({ product: athlete1.id, unit_amount: 48000, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_ATHLETE_1DOG=' + athlete1Price.id)

  const athleteAddon = await stripe.products.create({ name: 'Elite Membership - Add-on Dog', description: '12 sessions per month for second dog' })
  const athleteAddonPrice = await stripe.prices.create({ product: athleteAddon.id, unit_amount: 43200, currency: 'usd', recurring: { interval: 'month' } })
  console.log('STRIPE_PRICE_ATHLETE_ADDON=' + athleteAddonPrice.id)

  console.log('\nDone! Copy the lines above directly into your .env.local')
}

setupStripe().catch(console.error)