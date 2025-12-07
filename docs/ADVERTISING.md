# Woof Meetup - Advertising & Growth Guide

## Overview

This guide covers all aspects of advertising Woof Meetup, from immediate launch tasks to future optimization strategies. The platform has Google Analytics 4, Facebook Pixel, and Google Ads conversion tracking already integrated.

---

## Part 1: Pre-Campaign Checklist (Before Launching Ads)

### ✅ Immediate Tasks Before Running Google Ads Campaign

**1. Verify Google Analytics Setup**
- [ ] GA4 Measurement ID configured: `G-M5CT4ZDBRR`
- [ ] Cross-domain tracking enabled (if using multiple subdomains)
- [ ] Goals/Conversions created for:
  - User signup
  - First message sent
  - Payment completed
  - Dog profile created
- [ ] Google Analytics connected to Google Ads account

**2. Verify Google Ads Conversion Tracking**
- [ ] Conversion ID active: `AW-17768115674/g6B-CKDL3MwbENrbv5hC`
- [ ] Conversion value tracking enabled for payments
- [ ] Conversion ID validated via Google Tag Manager preview
- [ ] Conversion window set appropriately (typically 30 days for apps)
- [ ] Conversion categories assigned:
  - `sign_up` for user registrations
  - `purchase` for payment completions
  - Custom conversions for engagement metrics

**3. Verify Facebook Pixel Setup**
- [ ] Pixel ID active: `1848106269430105`
- [ ] Pixel helper extension confirms pixel firing
- [ ] Conversion tracking enabled for:
  - CompleteRegistration (signup)
  - Purchase (payments)
  - Contact (first message)
  - Interest (profile likes)
  - ViewContent (profile views)
- [ ] Pixel verified in Facebook Business Manager → Events Manager

**4. Website Compliance & Legal**
- [ ] Privacy policy updated to disclose tracking pixels
- [ ] Terms of service mention data collection
- [ ] GDPR compliance: Cookie consent (if EU traffic expected)
- [ ] Pixel consent configured for GDPR regions
- [ ] Facebook pixel consent mode enabled

**5. UTM Tracking Setup**
- [ ] UTM parameter tracking active (implemented in `analyticsService.js`)
- [ ] UTM naming convention documented:
  ```
  utm_source=google|facebook|tiktok
  utm_medium=cpc|organic|display
  utm_campaign=breed_specific|seasonal|retargeting
  utm_content=ad_variant_name
  utm_term=dog_breed|location
  ```
- [ ] Test URLs created with UTM parameters
- [ ] GA4 dashboard filters created for campaign analysis

**6. Landing Pages & Attribution**
- [ ] Dedicated landing page for ad traffic (optional but recommended)
- [ ] Clear value proposition visible above fold
- [ ] CTA button visible and prominent
- [ ] Mobile responsiveness tested
- [ ] Load time optimized (target <3s on 4G)

**7. Account & Settings**
- [ ] Google Ads account set up with correct billing
- [ ] Daily budget set conservatively ($10-15/day for initial testing)
- [ ] Campaign conversion tracking verified
- [ ] Conversion value settings correct (revenue from payments)
- [ ] Demographic bid adjustments configured

---

## Part 2: First Campaign Strategy (Google Ads Launch)

### Campaign Structure

```
Account: Woof Meetup
├── Campaign 1: Brand Awareness (Search)
│   ├── Ad Group: Generic Dog Dating Keywords
│   └── Ad Group: Dog Owner Interest
├── Campaign 2: High-Intent Conversions (Search)
│   ├── Ad Group: Dog Dating App
│   ├── Ad Group: Dog Social Network
│   └── Ad Group: Meet Dog Owners
└── Campaign 3: Remarketing (Display/YouTube)
    ├── Audience: Website visitors
    └── Audience: Signup but no dog profile
```

### Keyword Strategy (Start Simple)

**High-Intent Keywords (Tight Budget)**
- "dog dating app"
- "meet dog owners near me"
- "dog social network"
- "dog meetup app"
- Bid Strategy: Maximize conversions (set daily budget limit)
- Target CPA: $15-25 per signup

**Broad Keywords (Lower Priority)**
- "dog owner friends"
- "meet dogs online"
- "connect with dog owners"
- Bid Strategy: Manual CPC (lower bids)

### Ad Copy Template

**Headline 1:** "Meet Dog Lovers Near You"
**Headline 2:** "Woof Meetup - Dog Dating App"
**Headline 3:** "[City] Dog Owner Community"
**Description 1:** "Connect with dog owners, arrange meetups, send messages & earn credits. Join 1000s of dog lovers today."
**Description 2:** "100% Dog Owners • Real Matches • Free to Browse"

---

## Part 3: Facebook Pixel Strategy

### Events Being Tracked

| Event | When Fired | Pixel Value |
|-------|-----------|------------|
| `CompleteRegistration` | User signs up | $0 |
| `Contact` | First message sent | $1 |
| `Interest` | Profile liked | $1 |
| `Purchase` | Payment completed | $[amount] |
| `ViewContent` | Profile viewed | $0 |
| `InitiateCheckout` | Credit purchase started | $0 |
| `AddToCart` | Credit plan selected | $[price] |

### Audience Building Strategy

**Phase 1 (Weeks 1-2):**
1. Website Visitor Audience (all traffic)
   - Retention: 180 days
   - Size: Depends on traffic volume

2. Engaged Users Audience
   - Events: Signup completed, message sent, like sent
   - Retention: 90 days

**Phase 2 (Weeks 3-4):**
3. Custom Audience from Email
   - Export user emails from admin (see Admin Tasks below)
   - Upload to Facebook as Custom Audience
   - Use to create Lookalike Audience

**Phase 3 (Ongoing):**
4. Lookalike Audiences
   - Create from: Engaged users + payments
   - Location: US (start), expand if successful
   - Size: 1-5% lookalike

### Facebook Campaign Setup

```
Campaign 1: Awareness
├── Objective: Reach
├── Audience: Interests (dog owners, pet brands, outdoor activities)
├── Budget: $5/day
└── Ad Format: Image carousel (dog photos from UGC)

Campaign 2: Traffic
├── Objective: Traffic to Website
├── Audience: Dog owner interests + lookalikes
├── Budget: $5/day
└── Ad Format: Video (15-30s clips of successful matches)

Campaign 3: Conversions
├── Objective: Conversions (signup)
├── Audience: Website visitors, engaged users
├── Budget: $5/day
└── Ad Format: Story ads (mobile-first design)
```

---

## Part 4: Analytics & Dashboard Setup

### Google Analytics Custom Dashboard

**Create Dashboard: "Advertising Performance"**

1. **Top KPIs**
   - Sessions (total traffic)
   - Users (unique visitors)
   - Conversion Rate (goal completion %)
   - Cost per Conversion (manual calc: ad spend ÷ conversions)

2. **Conversion Tracking**
   - Signup completions (Goal: user_signup)
   - First message (Goal: message_sent)
   - Payments (Goal: payment_completed)
   - Like interactions (Goal: profile_liked)

3. **Campaign Filters**
   - Traffic by utm_source
   - Conversion by utm_campaign
   - ROI by utm_medium

4. **Engagement Metrics**
   - Average session duration
   - Bounce rate (lower is better)
   - Pages per session
   - Signup rate by traffic source

### UTM Parameter Reporting

**Standard Report Path:**
Google Analytics → Acquisition → All Traffic → Source/Medium

**Custom Report (create in GA4):**
- Dimensions: utm_source, utm_campaign, utm_content
- Metrics: Users, Conversions, Conversion Value
- Filter: campaign contains "paid" (or your naming convention)

---

## Part 5: Future Advertising Channels (Phased Expansion)

### Phase 2: TikTok Ads (Weeks 3-4)

**Why TikTok for Dog Apps:**
- Dog content outperforms all categories
- Younger demographic (18-35 dog owners)
- Lower CPC than Facebook ($0.02-0.10)
- High engagement on funny/cute dog videos

**Setup Required:**
- TikTok Ads Manager account
- TikTok Pixel integration (add to website)
- UGC (user-generated content) ads (hire dog owners to create 15-30s clips)
- $500-1000 initial budget for testing

**Campaign Template:**
```
Objective: Conversions (signup)
Daily Budget: $20
Target Audience: Dog lovers, 18-40, interests in pets
Creative: UGC dog videos (authentic, funny, relatable)
CTA: "Download" or "Visit Website"
Conversion Event: sign_up tracking via TikTok pixel
```

### Phase 3: Instagram Reels (Month 2)

**Content Strategy:**
- Reels: 15-30s clips of successful dog meetups
- Carousel ads: Dog photos with breed info + CTA
- Story ads: Full-screen mobile experience

**Audiences:**
- Dog-related interests (breeds, dog training, pet care)
- Competitors' followers
- Lookalikes of engaged users

### Phase 4: Reddit (Month 2)

**Communities to Target:**
- r/dogs (1.4M members)
- r/doglovers (600K members)
- r/location-specific subreddits (r/Denver, r/NYC, etc.)

**Strategy:**
- Organic: Quality posts about dog meetups (no hard sell)
- Ads: Reddit Ad Manager (requires $2000+ commitment)
- Sponsored content: Partner with popular users

### Phase 5: Google Search (Month 1.5)

**Search Terms (Already Implemented via Google Ads):**
- High commercial intent keywords
- "Dog dating app", "Meet dog owners", "Dog social network"
- Location-based: "Dog meetup [city]"

**Optimization:**
- Implement dynamic search ads
- Use conversion value for bid optimization
- A/B test landing pages

### Phase 6: App Store Optimization (ASO) - If Building Native Apps

**Elements:**
- App title with keywords
- Subtitle: Clear value proposition
- Icon: Recognizable, dog-focused
- Screenshots: Show core features (matching, messaging, meetups)
- Keyword list: Dog-related, breed names
- User reviews: Encourage 5-star ratings

---

## Part 6: Advanced Features to Implement Later

### 1. Email List Exports for Lookalike Audiences

**What to Build:**
- Admin endpoint: `POST /api/admin/export-users`
- Query: All verified users with email
- Export format: CSV (email, signup_date, activity_level)
- Privacy: Anonymized PII, compliant with regulations

**Implementation Details:**
```javascript
// server/routes/admin.route.js
router.post('/export-users', requireAuth, requireAdmin, async (req, res) => {
  // Export verified users only
  // Include: email, signup_date, num_messages, num_likes, subscribed
  // Sanitize before export
  // Log export for auditing
});
```

**Security Checklist:**
- [ ] Admin-only endpoint with role verification
- [ ] Rate limit export requests (1 per hour per admin)
- [ ] Log all exports for compliance
- [ ] Hash user IDs if using them
- [ ] GDPR: Only export users who consented

### 2. Referral Program Integration

**Current State:** Credits system exists

**Enhancement Needed:**
- Bonus credits for referring friends
- Tracking: Invite link includes unique referral code
- Reward: Both referrer and referee get bonus credits
- Condition: Referee must complete signup + create dog profile

**Implementation:**
```javascript
// Generate referral code on signup
const referralCode = generateUniqueCode(userId);

// Track referral: ?ref=CODE
// Award bonus on referee signup
// Award bonus to referrer when referee completes first action
```

### 3. Conversion Attribution Model

**Track:**
- First-touch attribution (which channel brought user initially)
- Last-touch attribution (which channel led to conversion)
- Multi-touch (weighted path to conversion)

**Implementation:**
```javascript
// Store in user model:
{
  attributes: {
    firstTouchSource: 'google',
    firstTouchCampaign: 'high_intent',
    lastTouchSource: 'organic',
    conversionPath: ['google > organic > direct']
  }
}
```

### 4. Dynamic Budget Allocation

**Monthly Review:**
- Analyze ROAS (Return on Ad Spend) by channel
- Increase budget for channels with ROAS > 3:1
- Decrease budget for channels with ROAS < 1.5:1
- Reserve 10% budget for testing new channels

**Metrics to Track:**
- Cost per signup (target: <$25 for Google, <$15 for Facebook)
- Cost per active user (target: <$30)
- Lifetime value vs. CAC (target: LTV ≥ 3x CAC)

### 5. Seasonal & Promotional Campaigns

**Campaign Ideas:**
- Spring: "Meet New Dogs This Spring" (outdoor activity angle)
- Summer: "Dog Park Meetups" (outdoor meetup focus)
- Fall: "Dog Breed Events" (specific breed meetups)
- Winter: "Indoor Dog Playdates" (winter activity)

---

## Part 7: Monitoring & Optimization (Weekly/Monthly)

### Weekly Checklist

- [ ] Check Google Ads dashboard for conversions and ROAS
- [ ] Monitor Facebook Ads Manager for click-through rate (CTR)
- [ ] Review new users' signup source via GA4
- [ ] Check for conversion tracking errors in both platforms
- [ ] Verify pixel firing with browser dev tools (Network tab)

### Monthly Reviews

**First Monday of Month:**
1. Pull GA4 report: Users, Signups, Revenue by utm_source
2. Pull Google Ads report: Conversions, Cost/Conv, ROAS
3. Pull Facebook Ads report: CTR, CPC, ROAS
4. Calculate: Cost per acquisition (CPA) by channel
5. Document findings in spreadsheet

**Optimization Actions:**
- Pause underperforming ad groups (CTR < 1%, CPA > target)
- Increase budget for winners (CTR > 2%, CPA < target)
- Refine audience targeting based on conversion data
- Update ad copy based on engagement metrics
- Test new keywords/audiences (10% of budget for testing)

---

## Part 8: Metrics Definitions & Targets

### Key Performance Indicators (KPIs)

| Metric | Definition | Current Target | How Tracked |
|--------|-----------|---------------|-----------:|
| **CAC** (Cost of Acquisition) | Cost per new user signup | <$25 | Ad spend ÷ signups |
| **LTV** (Lifetime Value) | Avg revenue per user | >$75 | Total payments ÷ total users |
| **LTV:CAC Ratio** | Lifetime value vs. acquisition cost | >3:1 | LTV ÷ CAC |
| **ROAS** (Return on Ad Spend) | Revenue per ad dollar | >2:1 | Revenue ÷ Ad spend |
| **Conversion Rate** | % of visitors who signup | >2% | Signups ÷ sessions |
| **Click-Through Rate (CTR)** | % of ad impressions clicked | >1% | Clicks ÷ impressions |
| **Cost Per Click (CPC)** | Average cost per ad click | <$1 (search), <$0.50 (social) | Ad spend ÷ clicks |
| **Cost Per Action (CPA)** | Cost per desired action | <$15 (payment) | Ad spend ÷ conversions |

### Healthy Benchmarks (Dog Social Apps)

```
User Acquisition Cost (CAC): $15-40
Signup Conversion Rate: 1-3%
First Message Rate: 30-50% of signups
Payment Conversion: 5-15% of signups
Churn Rate: 50-70% monthly
Engagement (DAU/MAU): 10-20%
```

---

## Part 9: Tools & Integrations Needed

### Required Tools (Already Have)

- ✅ Google Analytics 4 (GA4)
- ✅ Google Ads Account
- ✅ Facebook Business Manager
- ✅ Google Tag Manager (via GA4 integration)

### Tools to Add Later

| Tool | Purpose | Cost | Priority |
|------|---------|------|----------|
| **TikTok Ads Manager** | Native TikTok ads | Free (min $5/day) | Phase 2 |
| **Instagram Ads Manager** | Instagram/Reels ads | Free (min $1/day) | Phase 3 |
| **Hotjar** | User behavior tracking | $39-99/mo | Phase 3 |
| **Segment** | CDP for cross-platform data | $120+/mo | Phase 4 |
| **Klaviyo** | Email marketing | Free-$300/mo | Phase 4 |
| **Mixpanel** | Advanced analytics | Free-$1200/mo | Phase 4 |
| **Attribution Software** | Multi-touch attribution | $500+/mo | Phase 5 |

---

## Part 10: Compliance & Privacy Checklist

### GDPR Compliance (EU Users)

- [ ] Cookie banner on site (if EU traffic expected)
- [ ] Privacy policy includes ad tracking disclosure
- [ ] Pixel data processing agreement in place
- [ ] Users can opt-out of analytics
- [ ] Email export for lookalikes GDPR-compliant

### CCPA Compliance (California Users)

- [ ] Privacy policy includes California residents section
- [ ] Clear disclosure of data collection and sale
- [ ] Users can request deletion of data
- [ ] "Do Not Sell My Personal Information" link on site

### Facebook Compliance

- [ ] Ad account in good standing
- [ ] No prohibited content (hate speech, false claims)
- [ ] Ads directed to valid audience
- [ ] Landing page matches ad promise

### Google Compliance

- [ ] Account not using invalid traffic
- [ ] No click fraud or manipulation
- [ ] Landing pages meet quality guidelines
- [ ] Tracking snippet properly installed

---

## Part 11: Budget Recommendations by Phase

### Phase 1: Google Ads Launch (Week 1-2)

**Total Budget: $200-300**
```
Google Search Campaigns: $200
  ├── High-intent keywords: $150 (daily budget: $15)
  └── Brand + generic: $50 (daily budget: $5)

Testing & Setup: $100 (setup, UTM testing, GA4 config)
```

### Phase 2: Expansion (Week 3-4)

**Total Budget: $500-800**
```
Google Search (Scale): $250 → $350
Facebook Ads: $200 (pilot)
  ├── Awareness: $70
  ├── Conversions: $100
  └── Testing: $30
  
Manual CPA optimization: Ongoing
```

### Phase 3: Multi-Channel (Month 2)

**Total Budget: $1000-2000**
```
Google Search: $500
Facebook: $400
Instagram/Reels: $200
TikTok (if ready): $300
Organic/Testing: $200
```

---

## Part 12: Pre-Launch Verification Checklist

Before launching your Google Ads campaign, verify:

### Tracking
- [ ] GA4 Measurement ID: `G-M5CT4ZDBRR` firing on all pages
- [ ] Facebook Pixel ID: `1848106269430105` firing (test in Pixel Helper)
- [ ] Google Ads Conversion ID: `AW-17768115674/g6B-CKDL3MwbENrbv5hC` receiving events
- [ ] UTM parameters: Test URL with utm_source=test&utm_campaign=launch fires correctly in GA4
- [ ] Conversion events: Test signup flow, verify "user_signup" event fires in GA4 and Facebook

### Campaign Setup
- [ ] Google Ads: Daily budget set to $15
- [ ] Google Ads: Conversion tracking enabled
- [ ] Google Ads: Target CPA set to $25
- [ ] Google Ads: Keywords reviewed and negative keywords added
- [ ] Google Ads: Ad copy proofread

### Website
- [ ] Privacy policy mentions pixel tracking
- [ ] Mobile responsiveness tested on iOS/Android
- [ ] Form validation working (signup doesn't submit empty fields)
- [ ] Error messages user-friendly
- [ ] Load time acceptable (<3s on 4G)

### Financial
- [ ] Ad account budget set correctly
- [ ] Payment method verified
- [ ] Daily spending limit matches approved budget
- [ ] No unexpected charges expected

---

## Quick Reference: Current Tracking Setup

### Environment Variables

```
# Production (.env.production)
VITE_GA_MEASUREMENT_ID=G-M5CT4ZDBRR
VITE_FACEBOOK_PIXEL_ID=1848106269430105
VITE_GOOGLE_ADS_CONVERSION_ID=AW-17768115674/g6B-CKDL3MwbENrbv5hC

# Same IDs in development
```

### Events Being Tracked

**Google Analytics / Google Ads:**
- `user_signup` - Signup completion
- `message_sent` - First message sent
- `payment_completed` - Payment/purchase
- `profile_liked` - User liked a profile
- `dog_profile_created` - Dog profile added
- `profile_viewed` - Browsing profiles

**Facebook Pixel:**
- `CompleteRegistration` - Signup
- `Contact` - First message
- `Purchase` - Payment
- `Interest` - Profile like
- `ViewContent` - Profile view
- `AddToCart` / `InitiateCheckout` - Credit purchase flow

---

## Support & Questions

**For tracking issues:**
1. Check console errors in browser DevTools
2. Verify pixel firing in Facebook Pixel Helper / GA4 DebugView
3. Check `.env.production` and `.env.development` for correct IDs
4. Ensure correct event names in `client/src/services/analyticsService.js`

**For campaign performance:**
1. Review weekly metrics (see Part 7)
2. Document findings in spreadsheet
3. Adjust budgets based on ROAS (target >2:1)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** After first 2 weeks of ad spending
