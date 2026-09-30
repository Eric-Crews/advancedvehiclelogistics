import { sqliteTable, integer, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const loads = sqliteTable('loads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().default('other'),
  pickupType: text('pickup_type').notNull().default('other'),
  carryHelp: text('carry_help').notNull().default('unsure'),
  contactPhone: text('contact_phone'),
  contactPreference: text('contact_preference').notNull().default('email'),
  listingUrl: text('listing_url'),
  quoteCents: integer('quote_cents'),
  quoteNote: text('quote_note'),
  quoteSource: text('quote_source'),
  quotedAt: text('quoted_at'),
  currentQuoteId: text('current_quote_id'),
  bookingStatus: text('booking_status').notNull().default('not_booked'),
  bookingReference: text('booking_reference'),
  bookedProvider: text('booked_provider'),
  bookingNote: text('booking_note'),
  bookedAt: text('booked_at'),
  actualCostCents: integer('actual_cost_cents'),
  estimateId: text('estimate_id').unique(),
  requirementsVerifiedAt: text('requirements_verified_at'),
  requirementsVerificationNote: text('requirements_verification_note'),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  publicOrigin: text('public_origin'),
  publicDestination: text('public_destination'),
  publicSummary: text('public_summary'),
  pickupDate: text('pickup_date').notNull(),
  lengthFt: real('length_ft'),
  weightLbs: integer('weight_lbs'),
  equipment: text('equipment').notNull(),
  loading: text('loading').notNull(),
  unloading: text('unloading').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  brokerName: text('broker_name'),
  customerClerkId: text('customer_clerk_id'),
  status: text('status').notNull().default('broker_review'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('idx_loads_status_created').on(t.status, t.createdAt)]);

export const bids = sqliteTable('bids', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loadId: integer('load_id').notNull().references(() => loads.id),
  carrierName: text('carrier_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  mcNumber: text('mc_number').notNull(),
  equipment: text('equipment').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  status: text('status').notNull().default('pending_verification'),
  driverClerkId: text('driver_clerk_id'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('idx_bids_load').on(t.loadId)]);

export const drivers = sqliteTable('drivers', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  businessName: text('business_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  mcNumber: text('mc_number').notNull(),
  dotNumber: text('dot_number'),
  equipment: text('equipment').notNull(),
  about: text('about').notNull().default(''),
  serviceArea: text('service_area').notNull().default(''),
  vehicleDetails: text('vehicle_details').notNull().default(''),
  businessType: text('business_type').notNull().default('unspecified'),
  insuranceDescription: text('insurance_description').notNull().default(''),
  vehiclePhotoKey: text('vehicle_photo_key'),
  profilePhotoKey: text('profile_photo_key'),
  status: text('status').notNull().default('pending_verification'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const deliveryOptions = sqliteTable('delivery_options', {
 id: text('id').primaryKey(), loadId: integer('load_id').notNull().references(()=>loads.id),
 provider: text('provider').notNull(), costCents: integer('cost_cents').notNull(), extraCents: integer('extra_cents').notNull().default(0),
 service: text('service').notNull(), timing: text('timing').notNull(), availability: text('availability').notNull().default('unconfirmed'),
 validUntil: text('valid_until'), internalNote: text('internal_note'), createdAt: text('created_at').notNull(),
}, t=>[index('idx_options_load').on(t.loadId)]);
export const deliveryQuotes = sqliteTable('delivery_quotes', {
 id: text('id').primaryKey(), loadId: integer('load_id').notNull().references(()=>loads.id), optionId: text('option_id').notNull(),
 provider: text('provider').notNull(), costCents: integer('cost_cents').notNull(), extraCents: integer('extra_cents').notNull(),
 priceCents: integer('price_cents').notNull(), feeBps: integer('fee_bps').notNull(), fixedFeeCents: integer('fixed_fee_cents').notNull(),
 scope: text('scope').notNull(), timing: text('timing').notNull(), expiresAt: text('expires_at').notNull(),
 status: text('status').notNull().default('sent'), createdAt: text('created_at').notNull(),
 attemptId: text('attempt_id'), stripeSessionId: text('stripe_session_id'), checkoutUrl: text('checkout_url'),
 stripePaymentIntent: text('stripe_payment_intent'), paidAt: text('paid_at'), paymentReference: text('payment_reference'), paymentMethod: text('payment_method'),
},t=>[index('idx_quotes_load').on(t.loadId),index('idx_quotes_intent').on(t.stripePaymentIntent)]);
export const deskEvents=sqliteTable('desk_events',{
 id:integer('id').primaryKey({autoIncrement:true}),loadId:integer('load_id').notNull().references(()=>loads.id),actor:text('actor').notNull(),message:text('message').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_events_load').on(t.loadId)]);
export const notifications=sqliteTable('notifications',{
 id:text('id').primaryKey(),loadId:integer('load_id').notNull().references(()=>loads.id),recipient:text('recipient').notNull(),subject:text('subject').notNull(),body:text('body').notNull(),status:text('status').notNull().default('pending'),error:text('error'),createdAt:text('created_at').notNull(),sentAt:text('sent_at'),
},t=>[index('idx_notifications_load').on(t.loadId)]);

export const jobEstimates = sqliteTable('job_estimates', {
  id: text('id').primaryKey(), sessionHash: text('session_hash').notNull(),
  inputJson: text('input_json').notNull(), assessmentJson: text('assessment_json').notNull(), pricingJson: text('pricing_json').notNull(), draftJson: text('draft_json').notNull(),
  model: text('model').notNull(), promptVersion: text('prompt_version').notNull(), policyVersion: text('policy_version').notNull(),
  loadId: integer('load_id').references(() => loads.id), createdAt: text('created_at').notNull(), expiresAt: text('expires_at').notNull(),
}, t => [index('idx_estimates_session').on(t.sessionHash), index('idx_estimates_expiry').on(t.expiresAt)]);

export const aiUsageLimits = sqliteTable('ai_usage_limits', {
  key: text('key').primaryKey(), count: integer('count').notNull().default(0), expiresAt: integer('expires_at').notNull(),
}, t => [index('idx_ai_limits_expiry').on(t.expiresAt)]);

export const directListings = sqliteTable('direct_listings', {
 id: integer('id').primaryKey({autoIncrement:true}), shipperId:text('shipper_id').notNull(),
 title:text('title').notNull(), description:text('description').notNull(), origin:text('origin').notNull(), destination:text('destination').notNull(),
 pickupDate:text('pickup_date').notNull(), equipment:text('equipment').notNull(), weightLbs:integer('weight_lbs'), lengthFt:real('length_ft'),
 handling:text('handling').notNull(), offeredCents:integer('offered_cents').notNull(), shipperName:text('shipper_name').notNull(),
 shipperEmail:text('shipper_email').notNull(), shipperPhone:text('shipper_phone'), status:text('status').notNull().default('draft'),
 reviewNote:text('review_note'),stripeSessionId:text('stripe_session_id').unique(), selectedOfferId:integer('selected_offer_id'), createdAt:text('created_at').notNull(), paidAt:text('paid_at'),
}, t=>[index('idx_direct_listings_public').on(t.status,t.createdAt),index('idx_direct_listings_shipper').on(t.shipperId,t.createdAt)]);
export const directOffers = sqliteTable('direct_offers', {
 id:integer('id').primaryKey({autoIncrement:true}), listingId:integer('listing_id').notNull().references(()=>directListings.id),
 driverId:text('driver_id').notNull(), driverName:text('driver_name').notNull(), driverEmail:text('driver_email').notNull(),
 amountCents:integer('amount_cents').notNull(),note:text('note').notNull(),status:text('status').notNull().default('pending'),createdAt:text('created_at').notNull(),
},t=>[index('idx_direct_offers_listing').on(t.listingId,t.createdAt),uniqueIndex('idx_direct_offers_driver').on(t.listingId,t.driverId)]);

export const directReviews = sqliteTable('direct_reviews', {
 id:integer('id').primaryKey({autoIncrement:true}),listingId:integer('listing_id').notNull().unique().references(()=>directListings.id),
 driverId:text('driver_id').notNull(),shipperId:text('shipper_id').notNull(),rating:integer('rating').notNull(),
 comment:text('comment').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_direct_reviews_driver').on(t.driverId)]);

export const localUsers=sqliteTable('local_users',{
 id:text('id').primaryKey(),email:text('email').notNull().unique(),passwordHash:text('password_hash').notNull(),salt:text('salt').notNull(),createdAt:text('created_at').notNull(),failedAttempts:integer('failed_attempts').notNull().default(0),lockedUntil:text('locked_until'),
});
export const localSessions=sqliteTable('local_sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull().references(()=>localUsers.id),expiresAt:text('expires_at').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_local_sessions_user').on(t.userId)]);
